import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,

  TextInput,
  KeyboardAvoidingView,
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
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Icon from "@expo/vector-icons/MaterialIcons";
import { AppLocale } from "@/i18n";
import apiClient from "@/services/api";

import { logger } from "@/utils/logger";
// Simple Language Switcher Component
const SimpleLanguageSwitcher = () => {
  const { language, setLanguage } = useGlobalStore();

  const handleLanguageChange = () => {
    let newLang: AppLocale;
    switch (language) {
      case "en":
        newLang = "ta";
        break;
      case "ta":
        newLang = "en";
        break;
      default:
        newLang = "en";
    }
    setLanguage(newLang);
  };

  const getLanguageDisplayName = () => {
    switch (language) {
      case "en":
        return "தமிழ்";
      case "ta":
        return "English";
      default:
        return "தமிழ்";
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLanguageChange}
      style={{
        position: "absolute",
        top: Platform.OS === "ios" ? 60 : 40,
        right: 20,
        zIndex: 1000,
        backgroundColor: theme.colors.overlayDark,
        padding: 12,
        borderRadius: 25,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.colors.overlayLight,
      }}
    >
      <Image
        source={theme.images.translate.malayalam as any}
        style={{
          width: 20,
          height: 20,
          marginRight: 8,
          tintColor: COLORS.white,
        }}
      />
      <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "bold" }}>
        {getLanguageDisplayName()}
      </Text>
    </TouchableOpacity>
  );
};

// Custom Modal Component
const CustomModal = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  type = "error",
  showCancelButton = false,
  t,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  type?: "error" | "success" | "warning";
  showCancelButton?: boolean;
  t: (key: string) => string;
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

  const getModalColors = () => {
    switch (type) {
      case "error":
        return {
          background: "rgba(133, 1, 17, 0.95)",
          border: theme.colors.primary,
          icon: "error",
          iconColor: COLORS.white,
        };
      case "success":
        return {
          background: "rgba(76, 175, 80, 0.95)",
          border: theme.colors.success,
          icon: "check-circle",
          iconColor: COLORS.white,
        };
      case "warning":
        return {
          background: "rgba(255, 201, 12, 0.95)",
          border: theme.colors.secondary,
          icon: "warning",
          iconColor: COLORS.black,
        };
      default:
        return {
          background: "rgba(133, 1, 17, 0.95)",
          border: theme.colors.primary,
          icon: "error",
          iconColor: COLORS.white,
        };
    }
  };

  const colors = getModalColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Icon
              name={colors.icon as any}
              size={32}
              color={colors.iconColor}
            />
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtonContainer}>
            {showCancelButton && (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  {
                    borderColor:
                      type === "warning" ? theme.colors.grey : colors.border,
                    backgroundColor:
                      type === "warning"
                        ? "rgba(128, 128, 128, 0.3)"
                        : "rgba(255, 255, 255, 0.1)",
                  },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    {
                      color:
                        type === "warning" ? theme.colors.white : COLORS.white,
                    },
                  ]}
                >
                  {t("cancel") || "Cancel"}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.modalButton,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    type === "warning"
                      ? theme.colors.primary
                      : theme.colors.secondary,
                },
              ]}
              onPress={onConfirm || onClose}
            >
              <Text
                style={[
                  styles.modalButtonText,
                  {
                    color:
                      type === "warning" ? COLORS.white : theme.colors.textDark,
                  },
                ]}
              >
                {showCancelButton ? t("logout") || "Logout" : "OK"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function MpinVerify() {
  const { t } = useTranslation();
  const [mpinPins, setMpinPins] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "error" as "error" | "success" | "warning",
  });
  const [isLocked, setIsLocked] = useState(false);
  const [lockdownTimer, setLockdownTimer] = useState(0);
  const router = useRouter();
  const { login, isLoggedIn, logout, user } = useGlobalStore();

  logger.log("🔍 MPIN Verify - Component mounted");
  logger.log("🔍 MPIN Verify - isLoggedIn:", isLoggedIn);
  logger.log("🔍 MPIN Verify - user:", user ? "EXISTS" : "NOT_FOUND");
  const { width } = Dimensions.get("window");
  const logoWidth = width * 0.6;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Check token validity and user data on component mount
  useEffect(() => {
    const validateTokenAndUser = async () => {
      try {
        // Check if already logged in - but allow MPIN verification to proceed
        // This prevents automatic redirect when coming from auth check
        if (isLoggedIn) {
          logger.log(
            "🔍 MPIN Verify - User is logged in, but allowing MPIN verification to proceed"
          );
          // Don't redirect immediately - let user verify MPIN
        }

        // Get stored token and user data
        const token = await SecureStore.getItemAsync("authToken");
        const userData = await AsyncStorage.getItem("userData");

        // Only logout if absolutely no token exists (critical security issue)
        if (!token) {
          logger.log("No auth token found, redirecting to login");
          await logout();
          router.replace("/(auth)/login");
          return;
        }

        // Don't logout for missing user data - just continue with MPIN verification
        if (!userData) {
          logger.log(
            "Token exists but no user data, continuing with MPIN verification"
          );
          setInitializing(false);
          return;
        }

        // Validate token by checking if it's expired - be more lenient
        const isTokenValid = await validateToken(token);
        if (!isTokenValid) {
          logger.log(
            "Token is invalid/expired, but not logging out automatically"
          );
          // Don't automatically logout for expired tokens - let user try MPIN verification
          setInitializing(false);
          return;
        }

        // Token and user data are valid, show MPIN screen
        setInitializing(false);
      } catch (error) {
        logger.error(
          "Error validating token and user, but not logging out automatically:",
          error
        );
        // Don't automatically logout on error - let user continue
        setInitializing(false);
      }
    };

    validateTokenAndUser();
  }, [isLoggedIn, router, logout]);

  // Timer effect for lockdown countdown
  useEffect(() => {
    if (isLocked && lockdownTimer > 0) {
      timerRef.current = setTimeout(() => {
        setLockdownTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isLocked, lockdownTimer]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Validate token by checking expiration
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      // Simple JWT expiration check
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        return false;
      }

      // Use a simple base64 decode approach
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const currentTime = Date.now() / 1000;

      // Check if token is expired (with 5 minute buffer)
      if (payload.exp && payload.exp < currentTime + 300) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Error validating token:", error);
      return false;
    }
  };

  // Create refs for each of the 4 MPIN input fields
  const mpinInputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const showErrorModal = (title: string, message: string) => {
    setModalData({ title, message, type: "error" });
    setShowModal(true);
  };

  const showWarningModal = (title: string, message: string) => {
    setModalData({ title, message, type: "warning" });
    setShowModal(true);
  };

  const resetMpinAndFocus = () => {
    setMpinPins(["", "", "", ""]);
    // Focus on first input after a short delay
    setTimeout(() => {
      if (mpinInputRefs[0]) {
        mpinInputRefs[0].current?.focus();
      }
    }, 100);
  };

  const verifyMpin = async (enteredMpin: string) => {
    logger.log("🚀 verifyMpin function called with:", enteredMpin);

    // Prevent multiple simultaneous calls
    if (loading) {
      logger.log("🚀 verifyMpin blocked - already loading");
      return;
    }
    setLoading(true);
    logger.log("🔐 MPIN Verification - Starting verification process");

    try {
      // Validate MPIN input
      if (!enteredMpin || enteredMpin.length !== 4) {
        logger.log(
          "🔐 MPIN Verification - Invalid MPIN length:",
          enteredMpin.length
        );
        showErrorModal(t("error"), "Please enter a valid 4-digit MPIN");
        setLoading(false);
        return;
      }

      // Note: We always verify MPIN regardless of login status
      // This ensures MPIN verification is required every time

      // Check if account is locked
      if (isLocked) {
        logger.log("🔐 Account is locked, cannot verify MPIN");
        showWarningModal(
          t("error"),
          "Account is locked. Please wait before trying again."
        );
        setLoading(false);
        return;
      }

      // Get user data from storage
      const userDataString = await AsyncStorage.getItem("userData");
      logger.log(
        "🔐 MPIN Verification - User data from storage:",
        userDataString ? "EXISTS" : "NOT FOUND"
      );

      const userData = JSON.parse(userDataString || "{}");
      logger.log("🔐 MPIN Verification - Parsed user data:", {
        mobile_number: userData.mobile_number,
        user_id: userData.user_id,
        name: userData.name,
      });

      if (!userData.mobile_number) {
        logger.log(
          "🔐 MPIN Verification - No mobile number found in user data"
        );
        showErrorModal(t("error"), "User mobile number not found");
        setLoading(false);
        return;
      }

      // Validate mobile number format
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(userData.mobile_number)) {
        showErrorModal(t("error"), "Invalid mobile number format");
        setLoading(false);
        return;
      }

      logger.log("🔐 Verifying MPIN for mobile:", userData.mobile_number);
      logger.log("🔐 About to call API with data:", {
        mobileNumber: userData.mobile_number,
        mpin: enteredMpin,
      });

      // Call the auth/login-mpin API endpoint using apiClient
      logger.log("🔐 Making API call to /auth/login-mpin");
      const response = await apiClient.post(
        "/auth/login-mpin",
        {
          mobileNumber: userData.mobile_number,
          mpin: enteredMpin,
        },
        {
          timeout: 15000, // 15 second timeout
        }
      );
      logger.log("🔐 API call completed, response received");

      const data = response.data;
      logger.log("🔐 Response data:", data);

      // Handle different response structures
      const isSuccess =
        data.success || data.status === "success" || response.status === 200;
      const responseMessage = data.message || data.msg || "";

      if (isSuccess) {
        logger.log("🔐 MPIN verification successful");

        try {
          // Validate required fields in response
          if (!data.token) {
            throw new Error("Token not received from server");
          }

          if (!data.user) {
            throw new Error("User data not received from server");
          }

          // Store all tokens securely like in login flow
          await SecureStore.setItemAsync("authToken", data.token);
          await SecureStore.setItemAsync(
            "accessToken",
            data.accessToken || data.token
          );
          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync(
            "refreshToken",
            data.refreshtoken || ""
          );

          // Store user data in AsyncStorage like in login flow
          await AsyncStorage.setItem("userData", JSON.stringify(data.user));

          // Prepare user data with safe defaults
          const userData = {
            id: data.user.user_id || data.user.id,
            name: data.user.name || "",
            email: data.user.email || "",
            mobile: data.user.mobile_number || data.user.mobile || "",
            referralCode: data.user.referralCode || "",
            profile_photo: data.user.profile_photo || "",
            mpinStatus: data.user.mpinStatus || false,
            usertype: data.user.userType || data.user.usertype || "",
          };

          // Login to global store like in login flow
          logger.log(
            "🔍 Setting user data in global store (MPIN verify):",
            userData
          );
          login(data.token, userData);
          logger.log(
            "==========================================================================="
          );
          // Navigate to home page after successful MPIN verification
          router.replace("/(app)/(tabs)/home");
        } catch (storageError) {
          logger.error("Error storing authentication data:", storageError);
          Alert.alert(t("error"), t("failedToStoreAuthData"), [
            { text: t("ok") },
          ]);
        }
      } else {
        logger.log("🔐 MPIN verification failed:", data);
        shakeError();

        // Increment attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        logger.log("🔐 New attempts:", newAttempts);
        // Check if max attempts reached
        if (newAttempts >= 3) {
          // Start lockdown for 120 seconds
          setIsLocked(true);
          setLockdownTimer(120);
          showWarningModal(
            t("error"),
            "Maximum attempts reached. Please wait 2 minutes before trying again."
          );
        } else {
          showErrorModal(
            t("error"),
            `${responseMessage || t("incorrectMpin")} (${3 - newAttempts
            } attempts remaining)`
          );
        }

        // resetMpinAndFocus(); // Handled by modal close
        setMpinPins(["", "", "", ""]); // Just clear visual state
      }
    } catch (error: any) {
      logger.error("Error verifying MPIN:", error);

      // Handle 400 Bad Request specifically for MPIN verification
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        logger.log("🔐 400 Bad Request - MPIN verification failed:", errorData);

        shakeError();

        // Increment attempts
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        logger.log("🔐 New attempts:", newAttempts);

        // Check if max attempts reached
        if (newAttempts >= 3) {
          // Start lockdown for 120 seconds
          setIsLocked(true);
          setLockdownTimer(120);
          showWarningModal(
            t("error"),
            "Maximum attempts reached. Please wait 2 minutes before trying again."
          );
        } else {
          // Show the specific error message from the API
          const errorMessage = errorData.message || t("incorrectMpin");
          showErrorModal(
            t("error"),
            `${errorMessage} (${3 - newAttempts} attempts remaining)`
          );
        }

        // resetMpinAndFocus(); // Handled by modal close
        setMpinPins(["", "", "", ""]); // Just clear visual state
        return;
      }

      // Handle other network errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (error.code === "ECONNABORTED" || errorMessage.includes("timeout")) {
        showErrorModal(
          t("error"),
          "Request timed out. Please check your internet connection and try again."
        );
      } else if (errorMessage.includes("Network request failed")) {
        showErrorModal(
          t("error"),
          "Network error. Please check your internet connection."
        );
      } else if (errorMessage.includes("fetch")) {
        showErrorModal(
          t("error"),
          "Unable to connect to server. Please try again."
        );
      } else {
        showErrorModal(t("error"), t("failedToVerifyMpin"));
      }


      
      setMpinPins(["", "", "", ""]); // Just clear visual state
    } finally {
      setLoading(false);
    }
  };

  const handleEnterMpinChange = (text: string, index: number): void => {
    const newPins = [...mpinPins];
    newPins[index] = text;
    setMpinPins(newPins);

    // Move to next input if current input is filled and not the last one
    if (
      text.length === 1 &&
      index < mpinPins.length - 1 &&
      mpinInputRefs[index + 1]
    ) {
      mpinInputRefs[index + 1].current?.focus();
    }

    // Check if all 4 digits are entered and auto-verify
    if (text.length === 1 && index === mpinPins.length - 1) {
      const updatedPins = [...newPins];
      if (updatedPins.every((pin) => pin !== "")) {
        logger.log("🔘 All MPIN digits entered - auto-verifying MPIN");
        // Add subtle animation to indicate MPIN is complete
        animatePress();
        // Auto-verify after a short delay to allow user to see the complete MPIN
        setTimeout(() => {
          if (!loading && !isLocked) {
            logger.log("🔘 Auto-verifying MPIN:", updatedPins.join(""));
            verifyMpin(updatedPins.join(""));
          }
        }, 500); // 500ms delay for better UX
      }
    }
  };

  const handleMpinKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ): void => {
    if (e.nativeEvent.key === "Backspace" && !mpinPins[index] && index > 0) {
      const newPins = [...mpinPins];
      newPins[index - 1] = "";
      setMpinPins(newPins);
      if (mpinInputRefs[index - 1]) {
        mpinInputRefs[index - 1].current?.focus();
      }
    }
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View
        style={[styles.backgroundImage, { backgroundColor: theme.colors.primary }]}
      >
        <LinearGradient
          colors={[
            "rgba(32, 1, 1, 0)",
            "rgba(167, 0, 0, 0)",
            "rgba(118, 1, 1, 0.02)",
          ]}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={[styles.logo, { width: logoWidth }]}
                resizeMode="contain"
              />
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                {t("verifyingCredentials")}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View
      style={[styles.backgroundImage, { backgroundColor: theme.colors.primary }]}
    >
      <LinearGradient
        colors={[
          "rgba(32, 1, 1, 0)",
          "rgba(167, 0, 0, 0)",
          "rgba(118, 1, 1, 0.02)",
        ]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/images/logo_trans.png")}
                  style={[styles.logo, { width: logoWidth }]}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.formContainer}>
                <View style={styles.contentWrapper}>
                  <Text style={styles.mpinTitle}>{t("enterMpinTitle")}</Text>
                  <Text style={styles.mpinSubtitle}>
                    {t("enterMpinSubtitle")}
                  </Text>

                  {isLocked && (
                    <View style={styles.lockdownContainer}>
                      <Icon name="lock" size={20} color={COLORS.red} />
                      <Text style={styles.lockdownText}>
                        Account locked for {Math.floor(lockdownTimer / 60)}:{(lockdownTimer % 60).toString().padStart(2, "0")}
                      </Text>
                    </View>
                  )}

                  <Animated.View
                    style={[
                      styles.otpInputsContainer,
                      {
                        transform: [{ translateX: shakeAnim }],
                      },
                    ]}
                  >
                    {mpinPins.map((pin, index) => (
                      <View key={index} style={styles.inputWrapper}>
                        <TextInput
                          ref={mpinInputRefs[index]}
                          style={[
                            styles.otpInput,
                            pin ? styles.otpInputFilled : styles.otpInputEmpty,
                            isLocked && styles.otpInputDisabled,
                          ]}
                          keyboardType="numeric"
                          maxLength={1}
                          value={pin}
                          onChangeText={(text) =>
                            handleEnterMpinChange(text, index)
                          }
                          onKeyPress={(e) => handleMpinKeyPress(e, index)}
                          secureTextEntry={true}
                          autoFocus={index === 0}
                          editable={!isLocked}
                        />
                        {pin !== "" && <View style={styles.inputDot} />}
                      </View>
                    ))}
                  </Animated.View>

                  {/* View MPIN and Clear Button */}
                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.viewMpinButton}
                      onPress={() => {
                        // Show current MPIN in modal or alert
                        const currentMpin = mpinPins.join("");
                        if (currentMpin) {
                          showErrorModal(
                            "Current MPIN",
                            `Your entered MPIN: ${currentMpin}`
                          );
                        } else {
                          showErrorModal(
                            "No MPIN",
                            "Please enter your MPIN first"
                          );
                        }
                      }}
                      disabled={loading || isLocked}
                    >
                      <Icon
                        name="visibility"
                        size={20}
                        color={isLocked ? COLORS.grey : COLORS.white}
                      />
                      <Text
                        style={[
                          styles.viewMpinButtonText,
                          isLocked && { color: COLORS.grey },
                        ]}
                      >
                        {t("View_MPIN")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        resetMpinAndFocus();
                        setAttempts(0);
                      }}
                      disabled={loading || isLocked}
                    >
                      <Icon
                        name="clear"
                        size={20}
                        color={isLocked ? COLORS.grey : COLORS.white}
                      />
                      <Text
                        style={[
                          styles.clearButtonText,
                          isLocked && { color: COLORS.grey },
                        ]}
                      >
                        {t("clear")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Animated.View
                    style={{
                      transform: [{ scale: scaleAnim }],
                      width: "100%",
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        (loading || isLocked) && styles.loginButtonDisabled,
                      ]}
                      onPress={() => {
                        logger.log("🔘 MPIN Button Pressed");
                        logger.log("🔘 MPIN Pins:", mpinPins);
                        logger.log("🔘 Joined MPIN:", mpinPins.join(""));
                        logger.log("🔘 Is Locked:", isLocked);
                        logger.log("🔘 Loading:", loading);

                        if (!isLocked) {
                          animatePress();
                          logger.log("🔘 Joined MPIN:", mpinPins.join(""));
                          verifyMpin(mpinPins.join(""));
                        } else {
                          logger.log(
                            "🔘 Button press blocked - account is locked"
                          );
                        }
                      }}
                      disabled={loading || mpinPins.includes("") || isLocked}
                    >
                      <LinearGradient
                        colors={
                          isLocked
                            ? ["#cccccc", "#dddddd"]
                            : ["#ffc90c", "#ffd700"]
                        }
                        style={styles.buttonGradient}
                      >
                        <Text style={styles.loginButtonText}>
                          {loading
                            ? t("processing")
                            : isLocked
                              ? `Locked (${Math.floor(lockdownTimer / 60)}:${(
                                lockdownTimer % 60
                              )
                                .toString()
                                .padStart(2, "0")})`
                              : mpinPins.every((pin) => pin !== "") &&
                                !mpinPins.includes("")
                                ? "✓ " + t("verifying") + "..."
                                : t("login") + " " + attempts + "/3"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>

                  <View style={styles.bottomButtonsContainer}>
                    <TouchableOpacity
                      style={styles.logoutContainer}
                      onPress={async () => {
                        setModalData({
                          title: t("logout_confirmation_title") || "Logout",
                          message:
                            t("logout_confirmation_message") ||
                            "Are you sure you want to logout?",
                          type: "warning",
                        });
                        setShowModal(true);
                      }}
                    >
                      <Icon
                        name="logout"
                        size={20}
                        color={theme.colors.error || COLORS.red}
                      />
                      <Text style={styles.logoutLink}>
                        {t("logout") || "Logout"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.forgotContainer}
                      onPress={async () => {
                        // Navigate to MPIN reset flow instead of just logging out
                        router.push("/(auth)/forgot_mpin");
                      }}
                    >
                      <Icon
                        name="help-outline"
                        size={20}
                        color={theme.colors.secondary}
                      />
                      <Text style={styles.loginLink}>{t("Forgot_MPIN")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
      <SimpleLanguageSwitcher />

      {/* Custom Modal */}
      <CustomModal
        visible={showModal}
        title={modalData.title}
        message={modalData.message}
        type={modalData.type}
        showCancelButton={modalData.type === "warning"}
        onClose={() => {
          setShowModal(false);
          // Auto-focus on first input when error modal is closed
          if (modalData.type === "error") {
            setTimeout(() => {
              resetMpinAndFocus();
            }, 300); // Slight delay to ensure modal is fully gone
          }
        }}
        t={t}
        onConfirm={async () => {
          if (modalData.type === "warning") {
            try {
              await SecureStore.deleteItemAsync("user_mpin");
              logout();
              router.replace("/(auth)/login");
            } catch (error) {
              logger.error("Logout error:", error);
            }
          } else if (modalData.type === "error") {
             // Also handle the OK button press for error modals
             setTimeout(() => {
              resetMpinAndFocus();
            }, 300);
          }
          setShowModal(false);
        }}
      />
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
    paddingBottom: Platform.OS === "ios" ? 40 : 0,
  },
  logoContainer: {
    width: "100%",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 0,
    marginBottom: 0,
  },
  logo: {
    aspectRatio: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 0,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  mpinTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  mpinSubtitle: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  otpInputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "65%",
    alignSelf: "center",
    marginBottom: 30,
  },
  inputWrapper: {
    position: "relative",
    width: 45,
    height: 50,
  },
  otpInput: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderRadius: 12,
    textAlign: "center",
    fontSize: 24,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  otpInputEmpty: {
    borderColor: "rgba(174, 28, 28, 0.2)",
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  otpInputFilled: {
    borderColor: theme.colors.secondary,
    backgroundColor: COLORS.white,
    color: COLORS.black,
  },
  otpInputDisabled: {
    borderColor: COLORS.grey,
    backgroundColor: COLORS.lightGrey,
    color: COLORS.textSecondary,
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
  loginButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    marginTop: 20,
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
  buttonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 10,
    width: "100%",
  },
  forgotContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
  loginLink: {
    color: theme.colors.secondary,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  logoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
  },
  logoutLink: {
    color: COLORS.error,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
  },
  lockdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.errorLight,
  },
  lockdownText: {
    color: COLORS.errorLight,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.blackOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    flex: 1,
  },
  modalCancelButton: {
    // Background and text colors are set dynamically
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },

  // Action buttons styles
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  viewMpinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 167, 69, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(40, 167, 69, 0.5)",
  },
  viewMpinButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 53, 69, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(220, 53, 69, 0.5)",
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
});

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
  Pressable,
  Linking,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { responsiveUtils } from "@/utils/responsiveUtils";
const { wp, hp } = responsiveUtils;
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
import LanguageSelector from "@/components/LanguageSelector";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { SHADOW_UTILS } from "@/utils/shadowUtils";
import { getBorderRadius, rf } from "@/utils/responsiveUtils";
import ResponsiveText from "@/components/ResponsiveText";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { getImageSource } from "@/utils/imageUtils";


const borderRadius = getBorderRadius();

const ornamentImages = [
  require("../../../assets/images/slider1.png"),
  require("../../../assets/images/banner.png"),
  require("../../../assets/images/banner2.png"),
  require("../../../assets/images/scheme1.jpg"),
];

// Simple Language Switcher Component
const SimpleLanguageSwitcher = () => {
  const { language } = useGlobalStore();
  const [showSelector, setShowSelector] = useState(false);

  const insets = useSafeAreaInsets();
  const {
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
  } = useResponsiveLayout();

  const handleLanguageChange = () => {
    setShowSelector(true);
  };

  const getLanguageDisplayName = () => {
    switch (language) {
      case "en":
        return "English";
      case "ta":
        return "தமிழ்";
      case "mal":
        return "മലയാളം";
      case "te":
        return "తెలుగు";
      case "hi":
        return "हिन्दी";
      default:
        return "English";
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleLanguageChange}
        style={{
          position: "absolute",
          top: insets.top + (Platform.OS === "ios" ? 10 : 20),
          right: spacing.lg,
          zIndex: 1000,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: spacing.sm,
          borderRadius: 20,
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.3)",
          ...SHADOW_UTILS.card(),
        }}
      >
        <Icon
          name="translate"
          size={22}
          color={COLORS.white}
        />
      </TouchableOpacity>

      <LanguageSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </>
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
          background: COLORS.white,
          border: "rgba(133, 1, 17, 0.3)",
          icon: "error",
          iconColor: COLORS.error,
          textColor: COLORS.error,
          cancelTextColor: theme.colors.primary,
          cancelBg: "rgba(133, 1, 17, 0.05)",
          cancelBorder: "rgba(133, 1, 17, 0.2)",
        };
      case "success":
        return {
          background: "rgba(76, 175, 80, 0.95)",
          border: theme.colors.success,
          icon: "check-circle",
          iconColor: COLORS.white,
          textColor: COLORS.white,
          cancelTextColor: COLORS.white,
          cancelBg: "rgba(255, 255, 255, 0.1)",
          cancelBorder: theme.colors.success,
        };
      case "warning":
        return {
          background: COLORS.white,
          border: "rgba(133, 1, 17, 0.3)",
          icon: "warning",
          iconColor: COLORS.error,
          textColor: COLORS.black,
          cancelTextColor: theme.colors.primary,
          cancelBg: "rgba(133, 1, 17, 0.05)",
          cancelBorder: "rgba(133, 1, 17, 0.2)",
        };
      default:
        return {
          background: "rgba(133, 1, 17, 0.95)",
          border: theme.colors.primary,
          icon: "error",
          iconColor: COLORS.white,
          textColor: COLORS.white,
          cancelTextColor: COLORS.white,
          cancelBg: "rgba(255, 255, 255, 0.1)",
          cancelBorder: theme.colors.primary,
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
          <Text style={[styles.modalTitle, { color: colors.textColor }]}>{title}</Text>
          <Text style={[styles.modalMessage, { color: colors.textColor }]}>{message}</Text>
          <View style={styles.modalButtonContainer}>
            {showCancelButton && (
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  {
                    borderColor: colors.cancelBorder || colors.border,
                    backgroundColor: colors.cancelBg,
                  },
                ]}
                onPress={onClose}
              >
                <Text
                  style={[
                    styles.modalCancelButtonText,
                    {
                      color: colors.cancelTextColor,
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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [mpinPins, setMpinPins] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [modalData, setModalData] = useState({
    title: "",
    message: "",
    type: "error" as "error" | "success" | "warning",
  });
  const [isLocked, setIsLocked] = useState(false);
  const [lockdownTimer, setLockdownTimer] = useState(0);
  const [rates, setRates] = useState<{ gold_rate: number; silver_rate: number; show_silver: boolean } | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [userWantsToEnableBiometrics, setUserWantsToEnableBiometrics] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loginImages, setLoginImages] = useState<(string | null)[]>([null, null, null]);

  const { isVisible, visibleData } = useAppVisibility();
  const [currentOffset, setCurrentOffset] = useState(0);

  useEffect(() => {
    if (!isVisible("enableLoginBackgroundMovement") || !loginImages || loginImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentOffset(prev => prev + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [visibleData, loginImages]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const config = useGlobalStore.getState().appConfig;
        if (config?.brand?.loginImages && Array.isArray(config.brand.loginImages) && config.brand.loginImages.length >= 3) {
          setLoginImages(config.brand.loginImages);
          return;
        }

        const res = await apiClient.get("/config/settings");
        if (res?.data?.success && res?.data?.data) {
          const brand = res.data.data.brand;
          if (brand?.loginImages && Array.isArray(brand.loginImages) && brand.loginImages.length >= 3) {
            setLoginImages(brand.loginImages);
            return;
          }
        }

        const resImages = await apiClient.get("/intro-screens/active");
        if (resImages?.data?.success && Array.isArray(resImages.data.data) && resImages.data.data.length > 0) {
          const imagePaths = resImages.data.data.map((item: any) => item.image || null);
          setLoginImages(imagePaths);
        }
      } catch (err) {
        logger.warn("Failed to fetch login images from API, using defaults", err);
      }
    };
    fetchImages();
  }, []);
  const router = useRouter();
  const { mobile } = useLocalSearchParams();
  const mobileStr = Array.isArray(mobile) ? mobile[0] : mobile || "";
  const { login, isLoggedIn, logout, user } = useGlobalStore();

  logger.log("🔍 MPIN Verify - Component mounted");
  const { isSmallScreen, isMediumScreen, spacing } = useResponsiveLayout();
  logger.log("🔍 MPIN Verify - isLoggedIn:", isLoggedIn);
  logger.log("🔍 MPIN Verify - user:", user ? "EXISTS" : "NOT_FOUND");
  const { width } = Dimensions.get("window");
  const logoWidth = width * 0.6;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Biometric Auth Hook
  const {
    isSupported,
    isEnrolled,
    isEnabled,
    authenticate,
    enableBiometrics
  } = useBiometrics();

  // Handle Biometric Authentication
  const handleBiometricAuth = async () => {
    if (loading || isLocked) return;

    // Don't show modal if already showing one
    if (showModal) return;

    logger.log("🧬 Starting biometric authentication");
    const result = await authenticate();

    if (result.success && result.mpin) {
      logger.log("🧬 Biometric auth success, verifying MPIN");
      verifyMpin(result.mpin, true); // true = via biometrics
    } else if (result.error) {
      logger.log("🧬 Biometric auth failed:", result.error);
      if (result.error !== "User canceled" && result.error !== "Canceled") {
        // Optional: show error toast
      }
      // // On failure or cancel, immediately focus the first manual MPIN text input
      // setTimeout(() => {
      //   if (mpinInputRefs[0] && mpinInputRefs[0].current) {
      //     mpinInputRefs[0].current.focus();
      //   }
      // }, 300);
    }
  };

  const handleBiometricPress = () => {
    if (isEnabled) {
      handleBiometricAuth();
    } else {
      setUserWantsToEnableBiometrics(true);
      Alert.alert(
        t("enableBiometrics") || "Enable Biometric Login",
        t("enableBiometricsPrompt") || "Please enter your 4-digit MPIN first to verify and enable biometric login.",
        [
          {
            text: t("cancel") || "Cancel",
            style: "cancel",
            onPress: () => setUserWantsToEnableBiometrics(false)
          },
          {
            text: t("ok") || "OK",
            onPress: () => {
              if (mpinInputRefs[0] && mpinInputRefs[0].current) {
                mpinInputRefs[0].current.focus();
              }
            }
          }
        ]
      );
    }
  };

  // Auto-trigger biometrics only once when ready
  useEffect(() => {
    if (!initializing && isEnabled && !isLocked && !loading) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initializing, isEnabled]);

  // Manage keyboard listeners and auto-play slideshow
  // useEffect(() => {
  //   const keyboardDidShowListener = Keyboard.addListener(
  //     "keyboardDidShow",
  //     () => setIsKeyboardVisible(true)
  //   );
  //   const keyboardDidHideListener = Keyboard.addListener(
  //     "keyboardDidHide",
  //     () => setIsKeyboardVisible(false)
  //   );

  //   // Commented out live rates fetching due to unauthenticated state limitation
  //   // const fetchRates = async () => {
  //   //   try {
  //   //     const response = await apiClient.get("/rates/current");
  //   //     if (response.data && response.data.success && response.data.data) {
  //   //       setRates(response.data.data);
  //   //     }
  //   //   } catch (error) {
  //   //     logger.error("Error fetching live rates in mpin_verify:", error);
  //   //   }
  //   // };
  //   // fetchRates();

  //   const interval = setInterval(() => {
  //     setCurrentImageIndex((prevIndex) => (prevIndex + 1) % ornamentImages.length);
  //   }, 4000);

  //   return () => {
  //     keyboardDidShowListener.remove();
  //     keyboardDidHideListener.remove();
  //     clearInterval(interval);
  //   };
  // }, []);

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

        // If direct login via mobile param, bypass token check
        if (mobileStr) {
          logger.log("🔍 MPIN Verify - Direct login mode with mobile:", mobileStr);
          setInitializing(false);
          return;
        }

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
      const decodeBase64 = (str: string): string => {
        try {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let output = '';
          str = String(str).replace(/=+$/, '');
          for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
            buffer = chars.indexOf(buffer);
          }
          return output;
        } catch {
          return '';
        }
      };
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(decodeBase64(base64));
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

  const verifyMpin = async (enteredMpin: string, isBiometric: boolean = false) => {
    logger.log("🚀 verifyMpin function called with:", isBiometric ? "Biometrics" : "Manual Input");

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
      const activeMobileNumber = mobileStr || userData.mobile_number;

      logger.log("🔐 MPIN Verification - Active mobile number to verify:", activeMobileNumber);

      if (!activeMobileNumber) {
        logger.log(
          "🔐 MPIN Verification - No mobile number found"
        );
        showErrorModal(t("error"), "User mobile number not found");
        setLoading(false);
        return;
      }

      // Validate mobile number format
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(activeMobileNumber)) {
        showErrorModal(t("error"), "Invalid mobile number format");
        setLoading(false);
        return;
      }

      logger.log("🔐 Verifying MPIN for mobile:", activeMobileNumber);
      logger.log("🔐 About to call API with data:", {
        mobileNumber: activeMobileNumber,
        mpin: enteredMpin,
      });

      // Call the auth/login-mpin API endpoint using apiClient
      logger.log("🔐 Making API call to /auth/login-mpin");
      const response = await apiClient.post(
        "/auth/login-mpin",
        {
          mobileNumber: activeMobileNumber,
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
            branch_id: data.user.branch_id !== undefined ? data.user.branch_id : null,
            allow_multi_branch: data.user.allow_multi_branch !== undefined ? data.user.allow_multi_branch : null,
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

          const handlePostVerificationRedirect = async () => {
            try {
              logger.log("📡 Fetching visibility config in mpin_verify...");
              const visResponse = await apiClient.get('/app-visible', {
                headers: { Authorization: `Bearer ${data.token}` }
              });
              if (visResponse.data) {
                useGlobalStore.getState().setCachedVisibility(visResponse.data);
                if (visResponse.data.showDashboardAfterLogin === 0) {
                  logger.log("✅ Config dictates redirecting to home page instead of dashboard");
                  router.replace("/(app)/(tabs)/home");
                  return;
                }
              }
            } catch (visError) {
              logger.error("Error fetching visibility config in mpin_verify:", visError);
            }
            router.replace("/(app)/dashboard");
          };

          // Check if we should ask for biometric enrollment
          const hasDeclinedBiometrics = await AsyncStorage.getItem('hasDeclinedBiometrics');
          if (!isBiometric && !isEnabled && isSupported && isEnrolled && (hasDeclinedBiometrics !== 'true' || userWantsToEnableBiometrics)) {
            const title = t("setupBiometrics");
            const msg = t("setupBiometricsMsg");
            const yesText = t("yes");
            const noText = t("no");

            Alert.alert(
              title.startsWith("[missing") ? "Enable Biometrics" : title,
              msg.startsWith("[missing") ? "Would you like to use Face ID / Fingerprint for faster login next time?" : msg,
              [
                {
                  text: noText.startsWith("[missing") ? "No" : noText,
                  onPress: async () => {
                    try {
                      await AsyncStorage.setItem('hasDeclinedBiometrics', 'true');
                    } catch (err) {
                      logger.error("Error setting hasDeclinedBiometrics:", err);
                    }
                    setUserWantsToEnableBiometrics(false);
                    await handlePostVerificationRedirect();
                  }
                },
                {
                  text: yesText.startsWith("[missing") ? "Yes" : yesText,
                  onPress: async () => {
                    const success = await enableBiometrics(enteredMpin);
                    if (success) {
                      setUserWantsToEnableBiometrics(false);
                      Alert.alert(t("success"), t("biometricsEnabled") || "Biometrics enabled successfully", [
                        { text: "OK", onPress: () => handlePostVerificationRedirect() }
                      ]);
                    } else {
                      try {
                        await AsyncStorage.setItem('hasDeclinedBiometrics', 'true');
                      } catch (err) {
                        logger.error("Error setting hasDeclinedBiometrics after failure:", err);
                      }
                      setUserWantsToEnableBiometrics(false);
                      await handlePostVerificationRedirect();
                    }
                  }
                }
              ],
              { cancelable: false }
            );
          } else {
            await handlePostVerificationRedirect();
          }
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
            `${responseMessage || t("incorrectMpin")} (${3 - newAttempts} ${t("attemptsRemaining") || "attempts remaining"})`
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
            `${errorMessage} (${3 - newAttempts} ${t("attemptsRemaining") || "attempts remaining"})`
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

  const getIndexImage = (boxIndex: number) => {
    if (!loginImages || loginImages.length === 0) return null;
    const index = (boxIndex + currentOffset) % loginImages.length;
    return loginImages[index];
  };

  // Show loading screen while initializing
  if (initializing) {
    return (
      <View
        style={[styles.backgroundImage, { backgroundColor: theme.colors.quaternary }]}
      >
        <LinearGradient
          colors={[
            theme.colors.quaternary,
            theme.colors.quaternary,
          ]}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <View style={[styles.logoContainer, { alignItems: "center" }]}>
              <View style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 5,
              }}>
                <Image
                  source={require("../../../assets/images/logo_trans.png")}
                  style={{ width: logoWidth * 2, height: logoWidth * 2, aspectRatio: 1 }}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>
            </View>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                {t("initializing") || "Initializing..."}
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <LinearGradient
        colors={[
          "#FFFFFF",
          "#FFFFFF",
        ]}
        style={styles.gradient}
      >


        <KeyboardAvoidingView
          behavior={undefined}
          style={styles.container}
        >
          <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
            <View style={styles.container}>
              <View
                style={{
                  height: Platform.OS === 'ios' ? hp(34) : hp(30),
                  paddingTop: insets.top + (Platform.OS === 'ios' ? 20 : 10),
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                  backgroundColor: theme.colors.primary,
                  position: 'relative',
                }}
              >
                {/* Background Models Grid Watermark Layer (1, 2, 3 Grid Models) */}
                {isVisible("showLoginBackgroundImages") && (
                  <View style={{
                    position: 'absolute',
                    top: 10,
                    left: 12,
                    right: 12,
                    bottom: 10,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: 0.25,
                    zIndex: 0,
                  }}>
                    <View style={{
                      flex: 1,
                      height: '100%',
                      marginHorizontal: 4,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 215, 0, 0.25)',
                    }}>
                      <Image
                        source={getIndexImage(0) ? getImageSource(getIndexImage(0)) : require("../../../assets/images/intro_1.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{
                      flex: 1,
                      height: '100%',
                      marginHorizontal: 4,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 215, 0, 0.25)',
                    }}>
                      <Image
                        source={getIndexImage(1) ? getImageSource(getIndexImage(1)) : require("../../../assets/images/intro_2.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{
                      flex: 1,
                      height: '100%',
                      marginHorizontal: 4,
                      borderRadius: 12,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 215, 0, 0.25)',
                    }}>
                      <Image
                        source={getIndexImage(2) ? getImageSource(getIndexImage(2)) : require("../../../assets/images/intro_3.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                )}

                <Image
                  source={require("../../../assets/images/logo_trans.png")}
                  style={[
                    styles.logo,
                    {
                      width: 130,
                      height: 130,
                      aspectRatio: 1,
                      zIndex: 1,
                    },
                  ]}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </View>

              <View style={styles.formContainer}>
                {/* Custom wave curve at the top */}
                <View style={{ position: 'absolute', top: -39, left: 0, right: 0, height: 40, zIndex: 10, backgroundColor: 'transparent' }}>
                  <Svg height="40" width={width} viewBox={`0 0 ${width} 40`} style={{ position: 'absolute', top: 0, left: 0 }}>
                    <Path
                      d={`M0,40 C${width * 0.3},40 ${width * 0.7},0 ${width},0 L${width},40 L0,40 Z`}
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>

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

                  {(isLocked || attempts >= 2) && (
                    <TouchableOpacity
                      style={styles.lockoutResetButton}
                      onPress={() => router.push("/(auth)/forgot_mpin")}
                    >
                      <Icon name="vpn-key" size={18} color={COLORS.error} />
                      <Text style={styles.lockoutResetButtonText}>
                        Forgot MPIN? Reset via OTP
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 30 }}>
                    <Animated.View
                      style={[
                        styles.otpInputsContainer,
                        {
                          marginBottom: 0,
                          width: "60%",
                        },
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
                            secureTextEntry={!showMpin}
                            autoFocus={index === 0}
                            editable={!isLocked}
                          />
                          {pin !== "" && <View style={styles.inputDot} />}
                        </View>
                      ))}
                    </Animated.View>

                    <TouchableOpacity
                      style={{ marginLeft: 15, padding: 5 }}
                      onPress={() => setShowMpin(!showMpin)}
                      disabled={isLocked}
                    >
                      <Icon
                        name={showMpin ? "visibility-off" : "visibility"}
                        size={26}
                        color={isLocked ? COLORS.grey : theme.colors.primary}
                      />
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
                            : [theme.colors.primary, theme.colors.primary]
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

                  {/* Biometric Button */}
                  {(isSupported && isEnrolled) && (
                    <TouchableOpacity
                      style={styles.biometricButton}
                      onPress={handleBiometricPress}
                      disabled={loading || isLocked}
                    >
                      <Icon name="fingerprint" size={40} color={COLORS.primary} />
                      <Text style={styles.biometricText}>
                        {Platform.OS === 'ios' ? (t('faceIdTouchId') || 'Face ID / Touch ID') : (t('biometricLogin') || 'Biometric Login')}
                      </Text>
                    </TouchableOpacity>
                  )}

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

                  {/* Live Metal Rates Card - Commented out for future reuse when token becomes available
                  {!isKeyboardVisible && (
                    <View style={styles.liveRatesCardContainer}>
                      <BlurView intensity={30} tint="light" style={styles.liveRatesBlur}>
                        <View style={styles.liveRatesHeader}>
                          <View style={styles.liveIndicatorContainer}>
                            <View style={styles.livePulseDot} />
                            <Text style={styles.liveRatesTitle}>{t("liveRates") || "Live Metal Rates"}</Text>
                          </View>
                          <Text style={styles.liveRatesUpdateText}>DC Jewellers</Text>
                        </View>
                        
                        <View style={styles.ratesRow}>
                          <View style={styles.rateColumn}>
                            <Image
                              source={require("../../../assets/images/gold_coin_badge.png")}
                              style={styles.metalIcon}
                            />
                            <View>
                              <Text style={styles.metalName}>{t("gold") || "Gold"} (22K)</Text>
                              <Text style={styles.metalPrice}>
                                ₹{rates ? Math.round(rates.gold_rate) : "7,250"}/g
                              </Text>
                            </View>
                          </View>

                          {(!rates || rates.show_silver) && (
                            <View style={[styles.rateColumn, styles.rateColumnBorder]}>
                              <Image
                                source={require("../../../assets/images/silver_coin_badge.png")}
                                style={styles.metalIcon}
                              />
                              <View>
                                <Text style={styles.metalName}>{t("silver") || "Silver"}</Text>
                                <Text style={styles.metalPrice}>
                                  ₹{rates ? Math.round(rates.silver_rate) : "92"}/g
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </BlurView>
                    </View>
                  )}
                  */}

                  {/* {!isKeyboardVisible && (
                    <View style={styles.ornamentCardContainer}>
                      <Image
                        source={ornamentImages[currentImageIndex]}
                        style={styles.ornamentImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.75)"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.ornamentTextContainer}>
                        <Text style={styles.ornamentPromoTitle}>DC Jewellers Collections</Text>
                        <Text style={styles.ornamentPromoSubtitle}>Explore our pure gold savings schemes & new arrivals</Text>
                      </View>
                    </View>
                  )} */}

                  {!isKeyboardVisible && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(theme.constants.providerUrl)}
                      style={styles.poweredByContainer}
                    >
                      <Text style={styles.poweredByText}>Powered by {theme.constants.providerName}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </Pressable>
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
              await SecureStore.deleteItemAsync("user_biometric_mpin");
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
    paddingTop: Platform.OS === "ios" ? 80 : 50,
    marginBottom: 0,
  },
  logo: {
    height: 90,
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
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: Platform.OS === "ios" ? 80 : 100,
    backgroundColor: '#FFFFFF',
    zIndex: 1,
    position: 'relative',
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  mpinTitle: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  mpinSubtitle: {
    color: COLORS.primary,
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
    borderColor: "#cbd5e1",
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
    borderRadius: 8,
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
    color: "#FFFFFF",
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
    color: theme.colors.primary,
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
    backgroundColor: "rgba(255, 255, 255, 0.97)",
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
  lockoutResetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: COLORS.error,
    backgroundColor: "rgba(220, 53, 69, 0.15)",
    marginTop: 5,
    marginBottom: 20,
  },
  lockoutResetButtonText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: "bold",
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
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(220, 53, 69, 0.5)",
  },
  clearButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  biometricButton: {
    alignItems: 'center',
    marginVertical: 20,
    opacity: 0.9,
  },
  biometricText: {
    color: COLORS.primary,
    marginTop: 5,
    fontSize: 14,
  },
  liveRatesCardContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  liveRatesBlur: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
  },
  liveRatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  liveIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
  },
  liveRatesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  liveRatesUpdateText: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "600",
  },
  ratesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  rateColumn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    justifyContent: "center",
  },
  rateColumnBorder: {
    borderLeftWidth: 1,
    borderLeftColor: "rgba(0, 0, 0, 0.05)",
  },
  metalIcon: {
    width: 32,
    height: 32,
  },
  metalName: {
    fontSize: 12,
    color: COLORS.grey,
    fontWeight: "600",
  },
  metalPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 2,
  },
  ornamentCardContainer: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 25,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  ornamentImage: {
    width: "100%",
    height: "100%",
  },
  ornamentTextContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  ornamentPromoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.white,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ornamentPromoSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  poweredByContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 8,
  },
  poweredByText: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.4)",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});

import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Platform,
  Alert,
  Animated,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Linking,
  Modal,
  AppState,
  AppStateStatus,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  StatusBar,
} from "react-native";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import PhoneInput from "@/components/PhoneInputs";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import * as SecureStore from "expo-secure-store";
import { Feather, Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { registerStyles } from "../../_styles/registerStyles";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";

import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import LanguageSelector from "@/components/LanguageSelector";
import { AppLocale } from "@/i18n";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { animationUtils } from "@/utils/animationUtils";
import Loader from "@/components/Loader";
import { logger } from "@/utils/logger";
import {
  getCommonStyles,
  getSpacingValues,
  getBorderRadius,
} from "@/utils/responsiveUtils";
import { useOtpAutoFetch } from "@/hooks/useOtpAutoFetch";


// Responsive constants
const { wp, hp, rf, rp, rm, rb } = responsiveUtils;
const { SHADOW_UTILS } = shadowUtils;
const { ANIMATION_UTILS } = animationUtils;
const spacing = getSpacingValues();
const borderRadius = getBorderRadius();
const commonStyles = getCommonStyles();

// Debug Modal Component
const DebugModal = ({
  visible,
  onClose,
  storageData,
  onRefreshToken,
  isRefreshing,
}: {
  visible: boolean;
  onClose: () => void;
  storageData: { [key: string]: any };
  onRefreshToken: () => void;
  isRefreshing: boolean;
}) => {
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
  } = useResponsiveLayout();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.debugModalOverlay, { padding: spacing.lg }]}>
        <View
          style={[
            styles.debugModalContainer,
            {
              width: wp(90),
              maxWidth: 400,
              maxHeight: hp(85),
              borderRadius: borderRadius.large,
              padding: spacing.lg,
              ...SHADOW_UTILS.card(),
            },
          ]}
        >
          <View style={[styles.debugModalHeader, { marginBottom: spacing.md }]}>
            <ResponsiveText
              variant="title"
              size="lg"
              weight="bold"
              color={COLORS.dark}
              style={{ flex: 1 }}
            >
              🔍 Debug - Local Storage
            </ResponsiveText>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.debugCloseButton,
                {
                  padding: spacing.sm,
                  borderRadius: borderRadius.small,
                },
              ]}
            >
              <Ionicons name="close" size={rf(20)} color={COLORS.dark} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View
            style={[styles.debugActionButtons, { marginBottom: spacing.md }]}
          >
            <ResponsiveButton
              title={isRefreshing ? "Refreshing..." : "Refresh Token"}
              variant="outline"
              size="sm"
              loading={isRefreshing}
              disabled={isRefreshing}
              onPress={onRefreshToken}
              style={{ flex: 1 }}
            />
          </View>

          <View style={styles.debugModalContent}>
            {Object.keys(storageData).length === 0 ? (
              <ResponsiveText
                variant="body"
                align="center"
                color={COLORS.grey}
                style={{ padding: spacing.xl }}
              >
                No storage data found
              </ResponsiveText>
            ) : (
              Object.entries(storageData).map(([key, value]) => (
                <View
                  key={key}
                  style={[
                    styles.debugItemContainer,
                    {
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                      borderRadius: borderRadius.medium,
                      backgroundColor: COLORS.lightGrey,
                    },
                  ]}
                >
                  <ResponsiveText
                    variant="label"
                    weight="semibold"
                    color={COLORS.primary}
                    style={{ marginBottom: spacing.xs }}
                  >
                    {key}:
                  </ResponsiveText>
                  <ResponsiveText
                    variant="caption"
                    color={COLORS.dark}
                    allowWrap={true}
                    style={{ fontFamily: "monospace" }}
                  >
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </ResponsiveText>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const InvalidMobileModal = ({
  visible,
  onClose,
  onCreateAccount,
  mobileNumber,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  mobileNumber: string;
}) => {
  const { t } = useTranslation();
  const { spacing } = useResponsiveLayout();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { padding: spacing.lg }]}>
        <View
          style={[
            styles.modalContainer,
            {
              width: wp(90),
              maxWidth: 380,
              borderRadius: borderRadius.large,
              padding: spacing.xl,
              position: "relative",
              ...SHADOW_UTILS.card(),
            },
          ]}
        >
          {/* Close button in top right corner */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: spacing.md,
              right: spacing.md,
              zIndex: 10,
              padding: 4,
            }}
            onPress={onClose}
          >
            <Ionicons name="close" size={rf(22)} color={COLORS.mediumGrey} />
          </TouchableOpacity>

          {/* Header & Icon */}
          <View style={{ alignItems: "center", marginBottom: spacing.md }}>
            <View style={[styles.modalIconContainer, { backgroundColor: "rgba(133, 1, 17, 0.08)", padding: 16, borderRadius: 32, marginBottom: 8 }]}>
              <Ionicons
                name="person-add-outline"
                size={rf(40)}
                color={COLORS.primary}
              />
            </View>
            <ResponsiveText
              variant="title"
              size="lg"
              weight="bold"
              color={COLORS.dark}
              align="center"
              style={{ marginTop: spacing.sm }}
            >
              {t("numberNotRegistered") || "Number Not Registered"}
            </ResponsiveText>

            {/* Styled badge for Mobile Number */}
            <View style={[styles.numberBadge, { marginTop: spacing.sm }]}>
              <Text style={styles.numberBadgeText}>{mobileNumber}</Text>
            </View>
          </View>

          {/* Description Content */}
          <View style={{ paddingBottom: spacing.lg }}>
            <ResponsiveText
              variant="body"
              size="md"
              color={COLORS.dark}
              align="center"
              style={{ lineHeight: 22 }}
            >
              {t("mobileNotRegisteredDesc") || "This mobile number is not registered with our system. Would you like to create a new account to start your savings?"}
            </ResponsiveText>
          </View>

          {/* Action Button */}
          <View
            style={{
              marginTop: spacing.sm,
              width: "100%",
            }}
          >
            <ResponsiveButton
              title={t("createAccount") || "Register"}
              variant="primary"
              size="md"
              onPress={onCreateAccount}
              style={{ width: "100%" }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};
const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => {
  const {
    screenWidth,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
  } = useResponsiveLayout();

  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ANIMATION_UTILS.slideInFromTop(translateY).start();
    ANIMATION_UTILS.fadeIn(opacity).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onClose();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        registerStyles.errorAlert,
        {
          transform: [{ translateY }],
          opacity,
          marginHorizontal: spacing.lg,
          borderRadius: borderRadius.medium,
          padding: spacing.md,
          ...SHADOW_UTILS.card(),
        },
      ]}
    >
      <View style={[registerStyles.errorContent, { gap: spacing.sm }]}>
        <Ionicons name="alert-circle" size={rf(20)} color={COLORS.white} />
        <ResponsiveText
          variant="body"
          size="sm"
          color={COLORS.white}
          allowWrap={true}
          style={{ flex: 1 }}
        >
          {message}
        </ResponsiveText>
      </View>
      <TouchableOpacity
        onPress={onClose}
        style={[
          registerStyles.closeButton,
          {
            padding: spacing.sm,
            borderRadius: borderRadius.small,
          },
        ]}
      >
        <Ionicons name="close" size={rf(16)} color={COLORS.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const GlassmorphismCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={registerStyles.cardContainer}>
      {/* Base fog layer */}
      <LinearGradient
        colors={[
          "rgba(174, 0, 0, 0.1)",
          "rgba(34, 0, 0, 0.35)",
          "rgba(134, 1, 1, 0.4)",
        ]}
        style={StyleSheet.absoluteFill}
      />
      {/* Top fog highlight */}
      <LinearGradient
        colors={["rgba(112, 0, 0, 0.38)", "rgba(130, 0, 0, 0.4)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Bottom fog highlight */}
      <LinearGradient
        colors={["rgba(143, 0, 0, 0.29)", "rgba(122, 5, 5, 0.53)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Content */}
      <View style={registerStyles.cardContent}>{children}</View>
    </View>
  );
};

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
        <Image
          source={require("../../../assets/images/translate.png")}
          style={{
            width: 22,
            height: 22,
            tintColor: COLORS.white,
          }}
        />
      </TouchableOpacity>

      <LanguageSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </>
  );
};

export default function Login() {
  const params = useLocalSearchParams();
  // State for mobile number and OTP
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (params && params.mobile) {
      setMobile(params.mobile as string);
    }
  }, [params]);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isLoading: translationLoading } = useLanguage();

  // Safety check for translation function
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const safeT = (key: string, fallback?: string) => {
    try {
      return t ? t(key) : fallback || key;
    } catch (error) {
      logger.warn(`Translation error for key "${key}":`, error);
      return fallback || key;
    }
  };

  // Responsive layout hook
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
  } = useResponsiveLayout();

  // OTP related state
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(120);
  const [resendAttempts, setResendAttempts] = useState(3);
  const [isShowOtp, setIsShowOtp] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Refs for OTP inputs
  const inputRefs = [
    useRef<TextInput>(null),
  ];

  // Modal state
  const [showInvalidMobileModal, setShowInvalidMobileModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugStorageData, setDebugStorageData] = useState<{
    [key: string]: any;
  }>({});
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  // Global state and error handling
  const { login, isLoggedIn } = useGlobalStore();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [isNavigatingToRegister, setIsNavigatingToRegister] = useState(false);

  // Platform detection


  useEffect(() => {
    checkTokenValidity();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) showNetworkAlert();
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setOtpCode("");
      setIsShowOtp(false);
      setIsNavigatingToRegister(false);
    }, [])
  );

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (isShowOtp && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [isShowOtp, timer]);

  const checkTokenValidity = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) return;
    } catch (error) {
      logger.error("Error checking token:", error);
    }
  };

  const showNetworkAlert = () => {
    Alert.alert(t("noInternetTitle"), t("noInternetMessage"), [
      {
        text: t("retry"),
        onPress: async () => {
          const netState = await NetInfo.fetch();
          if (!netState.isConnected) showNetworkAlert();
        },
      },
    ]);
  };

  // OTP Auto-read functionality (Android only) - using SMS Retriever API
  useOtpAutoFetch({
    onOtpReceived: (otp: string) => {
      // Clean and set OTP
      const cleanOtp = otp.slice(0, 4);
      setOtpCode(cleanOtp);
      if (cleanOtp.length === 4) {
        verifyOtp(cleanOtp);
      }
    },
    isActive: isShowOtp, // Only listen when OTP screen is shown
  });

  const extractOtpFromMessage = (message: string) => {
    const otpMatch = message.match(/\d{4}/); // Assuming 4-digit OTP
    return otpMatch ? otpMatch[0] : null;
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const verifyOtp = (otp: string) => {
    setLoading(true);
    fetch(`${theme.baseUrl}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ mobile_number: mobile, otp }),
    })
      .then(async (response) => {
        const data = await response.json();
        logger.log("OTP verification response:", data);
        if (data.success) {
          try {
            // Store all tokens securely
            await SecureStore.setItemAsync("authToken", data.token);
            await SecureStore.setItemAsync("accessToken", data.accessToken);
            await SecureStore.setItemAsync("token", data.token);
            await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
            await AsyncStorage.setItem("userData", JSON.stringify(data.user));

            // Log token storage for debugging
            logger.log("🔍 Login - Token stored successfully:", {
              authToken: data.token ? "STORED" : "MISSING",
              accessToken: data.accessToken ? "STORED" : "MISSING",
              token: data.token ? "STORED" : "MISSING",
              refreshToken: data.refreshtoken ? "STORED" : "MISSING",
              userData: data.user ? "STORED" : "MISSING",
            });

            // Login to global store
            logger.log("🔍 Setting user data in global store:", {
              id: data.user.user_id,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile_number,
              referralCode: data.user.referralCode,
              profile_photo: data.user.profile_photo,
              mpinStatus: data.user.mpinStatus,
              usertype: data.user.userType,
            });
            login(data.token, {
              id: data.user.user_id,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile_number,
              referralCode: data.user.referralCode,
              profile_photo: data.user.profile_photo,
              mpinStatus: data.user.mpinStatus,
              usertype: data.user.userType,
            });

            // Navigate to MPIN verification after successful OTP verification
            logger.log("🔍 Login - Navigating to MPIN verification page...");
            router.replace("/(auth)/mpin_verify");
            setIsShowOtp(false);
          } catch (storageError) {
            logger.error("Error storing authentication data:", storageError);
            Alert.alert(t("error"), t("failedToStoreAuthData"), [
              { text: t("ok") },
            ]);
          }
        } else {
          setOtpCode("");
          Alert.alert(
            t("error"),
            data.message || data.error || t("invalidOtp"),
            [{ text: t("ok") }]
          );
        }
      })
      .catch((error) => {
        setOtpCode("");
        logger.error("OTP verification error:", error);

        let errorMessage = t("anUnexpectedError");

        // Handle fetch API error structure
        if (error.message) {
          errorMessage = error.message;
        } else if (error.error) {
          errorMessage = error.error;
        }

        // Check for specific error types
        if (
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("otp")
        ) {
          Alert.alert(t("invalidOtp"), errorMessage || t("invalidOtpMessage"), [
            { text: t("ok") },
          ]);
        } else if (
          errorMessage.toLowerCase().includes("network") ||
          errorMessage.toLowerCase().includes("connection")
        ) {
          Alert.alert(t("networkError"), t("checkInternetConnection"), [
            { text: t("ok") },
          ]);
        } else {
          Alert.alert(t("error"), errorMessage, [{ text: t("ok") }]);
        }
      })
      .finally(() => setLoading(false));
  };

  const loginAxio = async () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!mobile) {
      setMobileError(t("pleaseEnterMobile"));
      return;
    }
    if (!indianMobilePattern.test(mobile)) {
      setMobileError(t("valid10DigitIndianMobile"));
      return;
    }

    setMobileError("");
    setLoading(true);

    try {
      const response = await fetch(`${theme.baseUrl}/auth/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show OTP screen
        setIsShowOtp(true);
        setTimer(120);
        setResendAttempts(3); // Reset resend attempts when first OTP is sent
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || t("failedToSendOtp"));
      }

      setLoading(false);
    } catch (error: any) {
      logger.log("🔍 Login - Error caught:", error);

      // Handle fetch API error structure
      let errorMessage = t("youAreNotRegistered");

      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      logger.log("🔍 Login - Error message:", errorMessage);

      // If unregistered / invalid mobile error, redirect directly to UserBasicDetails
      if (
        errorMessage.toLowerCase().includes("invalid mobile number") ||
        errorMessage.toLowerCase().includes("not registered") ||
        errorMessage.toLowerCase().includes("not found") ||
        errorMessage
          .toLowerCase()
          .includes(t("invalidMobileNumber").toLowerCase()) ||
        errorMessage
          .toLowerCase()
          .includes(t("youAreNotRegistered").toLowerCase())
      ) {
        logger.log(
          "🔍 Login - Unregistered mobile number. Showing confirmation modal:",
          mobile
        );
        setLoading(false);
        setShowInvalidMobileModal(true);
      } else {
        showErrorAlert(errorMessage);
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendAttempts <= 0) {
      Alert.alert(t("error"), t("resendLimitReached"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/auth/check-mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendAttempts((prev) => prev - 1);
        setTimer(120);
        setOtpCode("");
        Alert.alert(t("success"), t("otpResentSuccess"));
        // Auto-focus first OTP input
        setTimeout(() => inputRefs[0]?.current?.focus(), 100);
      } else {
        throw new Error(data?.error || t("failedToResendOtp"));
      }
    } catch (error: any) {
      logger.log("🔍 Resend OTP - Error caught:", error);

      let errorMessage = t("failedToResendOtp");

      // Handle fetch API error structure
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error) {
        errorMessage = error.error;
      }

      logger.log("🔍 Resend OTP - Error message:", errorMessage);
      showErrorAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackButton = () => {
    if (isShowOtp) {
      // If OTP fields are showing, hide them and go back to mobile input
      setIsShowOtp(false);
      setOtpCode("");
      setTimer(120);
      setResendAttempts(3);
      setShowOtp(false); // Reset OTP visibility
      // Stop SMS listener when going back to mobile input

    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

  const handleDebugButton = async () => {
    try {
      // Get all AsyncStorage keys
      const keys = await AsyncStorage.getAllKeys();
      const storageData: { [key: string]: any } = {};

      // Get all values
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        try {
          storageData[key] = value ? JSON.parse(value) : value;
        } catch {
          storageData[key] = value;
        }
      }

      // Get SecureStore data
      const secureKeys = ["authToken", "accessToken", "token", "refreshToken"];
      for (const key of secureKeys) {
        try {
          const value = await SecureStore.getItemAsync(key);
          if (value) {
            storageData[`secure_${key}`] = value;
          }
        } catch (error) {
          logger.log(`Error getting secure key ${key}:`, error);
        }
      }

      // Add token analysis
      const tokenAnalysis: { [key: string]: any } = {};

      // Check main token
      const mainToken = await SecureStore.getItemAsync("token");
      if (mainToken) {
        try {
          const tokenParts = mainToken.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const expirationTime = payload.exp * 1000;
            const currentTime = Date.now();
            const isExpired = currentTime >= expirationTime;

            tokenAnalysis["token_status"] = {
              exists: true,
              format: "valid",
              expires_at: new Date(expirationTime).toLocaleString(),
              is_expired: isExpired,
              time_until_expiry: isExpired
                ? "EXPIRED"
                : `${Math.round((expirationTime - currentTime) / 1000)}s`,
              payload: payload,
            };
          } else {
            tokenAnalysis["token_status"] = {
              exists: true,
              format: "invalid",
              error: "Not a valid JWT format",
            };
          }
        } catch (error) {
          tokenAnalysis["token_status"] = {
            exists: true,
            format: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      } else {
        tokenAnalysis["token_status"] = {
          exists: false,
          format: "none",
          error: "No token found",
        };
      }

      // Check global store state
      const globalState = useGlobalStore.getState();
      tokenAnalysis["global_store"] = {
        isLoggedIn: globalState.isLoggedIn,
        hasToken: !!globalState.token,
        hasUser: !!globalState.user,
        user: globalState.user,
      };

      // Merge all data
      const finalData = {
        ...storageData,
        ...tokenAnalysis,
      };

      setDebugStorageData(finalData);
      setShowDebugModal(true);
    } catch (error) {
      logger.error("Error getting debug data:", error);
      Alert.alert("Debug Error", "Failed to get storage data");
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshingToken(true);
    try {
      const refreshToken = await SecureStore.getItemAsync("refreshToken");
      if (!refreshToken) {
        Alert.alert("Error", "No refresh token available");
        return;
      }

      const response = await fetch(`${theme.baseUrl}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store new tokens
        await SecureStore.setItemAsync("token", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        await SecureStore.setItemAsync("authToken", data.token);

        // Update global store
        const globalState = useGlobalStore.getState();
        globalState.login(data.token, globalState.user || {});

        Alert.alert("Success", "Token refreshed successfully!");

        // Refresh debug data
        handleDebugButton();
      } else {
        Alert.alert("Error", data.message || "Failed to refresh token");
      }
    } catch (error) {
      logger.error("Token refresh error:", error);
      Alert.alert("Error", "Failed to refresh token. Please try again.");
    } finally {
      setIsRefreshingToken(false);
    }
  };

  if (isLoggedIn) return null;

  // Show loading while translations are being initialized
  if (translationLoading) {
    return (
      <View style={[registerStyles.container, { paddingTop: 0, backgroundColor: theme.colors.quaternary }]}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Loader visible={true} message="Loading..." />
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.primary,
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#850111" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <LinearGradient
            colors={[
              "#FCF9F6",
              "#FCF9F6",
            ]}
            style={StyleSheet.absoluteFill}
          >
            {/* Curved wave header background */}
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: hp(39),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.22,
              shadowRadius: 8,
              elevation: 8,
            }}>
              <Svg
                height="100%"
                width="100%"
                viewBox="0 0 375 320"
                preserveAspectRatio="none"
              >
                <Defs>
                  <SvgLinearGradient id="waveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#850111" />
                    <Stop offset="100%" stopColor="#5a000b" />
                  </SvgLinearGradient>
                </Defs>
                {/* Wave Shape */}
                <Path
                  d="M0,0 L0,260 C100,325 180,185 270,265 C320,310 350,250 375,230 L375,0 Z"
                  fill="url(#waveGrad)"
                />
                {/* Golden Outline Line */}
                <Path
                  d="M0,260 C100,325 180,185 270,265 C320,310 350,250 375,230"
                  fill="none"
                  stroke="#eca50b"
                  strokeWidth="4"
                />
              </Svg>
            </View>
            <SimpleLanguageSwitcher />

            {/* Debug Button */}


            {showError && (
              <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
            )}
            <KeyboardAvoidingView
              behavior={undefined}
              style={{ flex: 1 }}
            >
              <ScrollView
                contentContainerStyle={[
                  registerStyles.scrollViewContent,
                  {
                    flexGrow: 1,
                    minHeight: screenHeight,
                    paddingTop: Platform.OS === "ios" ? insets.top + (isSmallScreen ? 4 : 8) : 55,
                    paddingBottom: insets.bottom + 40,
                    // Prevent any keyboard-related adjustments
                    position: "relative",
                  },
                ]}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Pressable onPress={Keyboard.dismiss} style={{ flex: 1, width: "100%" }}>
                  <View
                    style={[
                      registerStyles.logoContainer,
                      {
                        paddingTop: 0,
                        marginBottom: spacing.sm,
                        alignItems: "center",
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Image
                      source={require("../../../assets/splashscreen_logo.png")}
                      style={[
                        registerStyles.logo,
                        {
                          width: wp(78),
                          height: hp(28),
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>

                  <View
                    style={[
                      registerStyles.formContainer,
                      {
                        paddingHorizontal: spacing.lg,
                        paddingTop: 0,
                        paddingBottom: spacing.xl,
                      },
                    ]}
                  >
                    <View
                      style={[
                        {
                          paddingHorizontal: spacing.lg,
                          paddingBottom: spacing.lg,
                          paddingTop: 0,
                          marginBottom: spacing.md,
                          alignItems: "center",
                          justifyContent: "center",
                        },
                      ]}
                    >
                      {!isShowOtp ? (<>
                        <ResponsiveText
                          variant="title"
                          size="lg"
                          weight="bold"
                          color={theme.colors.primary}
                          align="center"
                          truncateMode="double"
                          style={[registerStyles.pageTitle, { marginBottom: 0 }]}
                        >
                          {safeT("welcome", "Welcome")}!
                        </ResponsiveText>
                        {/* <ResponsiveText
                          variant="subtitle"
                          size="md"
                          color={theme.colors.primary}
                          align="center"
                          truncateMode="double"
                          style={registerStyles.subtitle}
                        >
                          {safeT("signInToContinue", "Sign in to continue")}
                        </ResponsiveText> */}
                        {__DEV__ && (
                          <TouchableOpacity
                            onPress={() => {
                              try {
                                const crashlytics = require('@react-native-firebase/crashlytics').default;
                                crashlytics().log('Test crash triggered by developer');
                                crashlytics().crash();
                              } catch (error) {
                                console.log('Crashlytics is not available in this environment:', error);
                                Alert.alert('Not Available', 'Crashlytics is only available in a native Dev Client / Release build.');
                              }
                            }}
                            style={{
                              backgroundColor: "#E74C3C",
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              borderRadius: 20,
                              marginTop: 10,
                              alignSelf: 'center',
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.2)"
                            }}
                          >
                            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>
                              💥 Trigger Test Crash (Dev Only)
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                      ) : null}
                      {!isShowOtp ? (
                        <>
                          <View style={registerStyles.inputContainer}>
                            <PhoneInput
                              value={mobile}
                              label={t("registerMobileNumber")}
                              onChangeText={(text) => {
                                setMobile(text);
                                setMobileError("");
                              }}
                              loading={loading}
                              disableBlurAlert={isNavigatingToRegister}
                            />
                            {mobileError ? (
                              <ResponsiveText
                                variant="caption"
                                size="sm"
                                color={theme.colors.error}
                                align="left"
                                truncateMode="double"
                                style={registerStyles.errorText}
                              >
                                {mobileError}
                              </ResponsiveText>
                            ) : null}
                          </View>
                          <ResponsiveButton
                            title={loading ? t("processing") : t("getOtp")}
                            variant="secondary"
                            size="md"
                            fullWidth={true}
                            loading={loading}
                            disabled={loading}
                            onPress={loginAxio}
                            style={[
                              {
                                width: "100%",
                                maxWidth: wp(75),
                                height: 42,
                                minHeight: 42,
                                borderRadius: 21,
                                overflow: "hidden",
                                marginTop: spacing.md,
                              },
                              loading && registerStyles.loginButtonDisabled,
                            ]}
                          />
                          <View style={registerStyles.registerContainer}>
                            <ResponsiveText
                              variant="body"
                              size="md"
                              color={theme.colors.primary}
                              align="center"
                              allowWrap={true}
                              maxLines={2}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.75}
                              style={[
                                registerStyles.registerText,
                                { fontSize: 16 },
                              ]}
                            >
                              {t("dontHaveAccount")}{" "}
                            </ResponsiveText>
                            <TouchableOpacity
                              onPress={() => {
                                setIsNavigatingToRegister(true);
                                router.push("/userBasicDetails");
                              }}
                            >
                              <ResponsiveText
                                variant="body"
                                size="md"
                                weight="bold"
                                color={theme.colors.primary}
                                align="center"
                                allowWrap={false}
                                maxLines={1}
                                adjustsFontSizeToFit={true}
                                minimumFontScale={0.75}
                                style={[
                                  registerStyles.registerLink,
                                  { fontSize: 16 },
                                ]}
                              >
                                {t("register")}
                              </ResponsiveText>
                            </TouchableOpacity>
                          </View>
                        </>
                      ) : (
                        <View
                          style={[
                            registerStyles.otpContainer,
                            {
                              paddingVertical: 0,
                              minHeight: isSmallScreen ? 200 : 220,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                          ]}
                        >
                          <ResponsiveText
                            variant="title"
                            size="lg"
                            weight="bold"
                            color={theme.colors.primary}
                            align="center"
                            allowWrap={true}
                            maxLines={2}
                            adjustsFontSizeToFit={true}
                            minimumFontScale={0.8}
                            style={[registerStyles.otpTitle, { marginBottom: 0 }]}
                          >
                            {safeT("enterOTP", "Enter OTP")}
                          </ResponsiveText>
                          <View style={registerStyles.otpSentContainer}>
                            <ResponsiveText
                              variant="body"
                              size="sm"
                              color={theme.colors.primary}
                              align="center"
                              allowWrap={true}
                              maxLines={2}
                              adjustsFontSizeToFit={true}
                              minimumFontScale={0.7}
                              style={registerStyles.otpSentText}
                            >
                              {t("otpSentTo")}{" "}
                              {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                            </ResponsiveText>
                            <TouchableOpacity
                              onPress={() => setIsShowOtp(false)}
                              style={registerStyles.editIconButton}
                            >
                              <Feather
                                name="edit-2"
                                size={18}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                          </View>
                          <Pressable
                            style={[
                              registerStyles.otpInputsWrapper,
                              { alignItems: "center", justifyContent: "center", position: "relative" },
                            ]}
                            onPress={() => {
                              // Force focus on the input when the container is pressed
                              inputRefs[0].current?.focus();
                            }}
                          >
                            {/* Hidden TextInput for OTP Autofill */}
                            <TextInput
                              ref={inputRefs[0]}
                              value={otpCode}
                              onChangeText={(text) => {
                                const numericValue = text.replace(/[^0-9]/g, "");
                                setOtpCode(numericValue);
                                if (numericValue.length === 4) {
                                  verifyOtp(numericValue);
                                }
                              }}
                              style={{
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                opacity: 0,
                                zIndex: 10,
                              }}
                              keyboardType="numeric"
                              maxLength={4}
                              textContentType="oneTimeCode"
                              autoComplete="sms-otp"
                              editable={!loading}
                              autoFocus={true}
                              pointerEvents="none" // Pass touches to parent Pressable to ensure reliable focus on iOS
                            />

                            <View
                              style={[
                                registerStyles.otpInputsContainer,
                                {
                                  width: isSmallScreen ? "85%" : "80%",
                                  maxWidth: isSmallScreen ? 280 : 320,
                                  minWidth: isSmallScreen ? 160 : 180,
                                  alignItems: "center",
                                  justifyContent: "center",
                                  zIndex: 1, // Ensure visual elements are below the hidden input touch area
                                },
                              ]}
                              pointerEvents="none" // Pass touches to the hidden input
                            >
                              {[0, 1, 2, 3].map((index) => (
                                <View
                                  key={index}
                                  style={[
                                    registerStyles.otpInput,
                                    {
                                      width: isSmallScreen ? 42 : 48,
                                      height: isSmallScreen ? 42 : 48,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      borderColor: otpCode.length === index ? theme.colors.primary : "rgba(133, 1, 17, 0.15)",
                                      backgroundColor: theme.colors.white,
                                      // 3D Shadow properties
                                      shadowColor: "#000",
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.08,
                                      shadowRadius: 3,
                                      elevation: 2,
                                    },
                                  ]}
                                >
                                  <ResponsiveText
                                    variant="title"
                                    size="lg"
                                    weight="bold"
                                    color={theme.colors.textDark}
                                    style={{
                                      fontSize: isSmallScreen ? 20 : 22,
                                    }}
                                  >
                                    {otpCode[index] || ""}
                                  </ResponsiveText>
                                </View>
                              ))}
                            </View>
                            <TouchableOpacity
                              onPress={() => setShowOtp((prev) => !prev)}
                              style={[
                                registerStyles.eyeButton,
                                {
                                  right: isSmallScreen ? -35 : -40,
                                  top: isSmallScreen ? 15 : 20,
                                  zIndex: 20, // Keep eye button clickable above hidden input
                                },
                              ]}
                            >
                              <Feather
                                name={showOtp ? "eye-off" : "eye"}
                                size={isSmallScreen ? 20 : 24}
                                color={theme.colors.primary}
                              />
                            </TouchableOpacity>
                          </Pressable>
                          <View
                            style={[
                              registerStyles.timerContainer,
                              { alignItems: "center", justifyContent: "center" },
                            ]}
                          >
                            <Ionicons
                              name="time-outline"
                              size={20}
                              color={theme.colors.primary}
                            />
                            <ResponsiveText
                              variant="caption"
                              size="sm"
                              color={theme.colors.primary}
                              align="center"
                              truncateMode="single"
                              inRow={true}
                              style={registerStyles.timerText}
                            >
                              {t("resendIn")} {timer}s
                            </ResponsiveText>
                          </View>
                          {timer === 0 && resendAttempts > 0 && (
                            <TouchableOpacity
                              onPress={handleResendOtp}
                              style={[
                                registerStyles.resendButton,
                                { alignSelf: "center" },
                              ]}
                              disabled={loading}
                            >
                              <ResponsiveText
                                variant="caption"
                                size="sm"
                                color={theme.colors.primary}
                                align="center"
                                truncateMode="double"
                                style={registerStyles.resendText}
                              >
                                {loading ? t("resending") : t("resendOTP")} (
                                {resendAttempts} {t("left")})
                              </ResponsiveText>
                            </TouchableOpacity>
                          )}
                          {timer === 0 && resendAttempts === 0 && (
                            <View
                              style={[
                                registerStyles.timerContainer,
                                {
                                  alignItems: "center",
                                  justifyContent: "center",
                                },
                              ]}
                            >
                              <Ionicons
                                name="alert-circle"
                                size={20}
                                color={COLORS.errorLight}
                              />
                              <ResponsiveText
                                variant="caption"
                                size="sm"
                                color={COLORS.errorLight}
                                align="center"
                                truncateMode="double"
                                inRow={true}
                                style={registerStyles.timerText}
                              >
                                {t("resendLimitReached")}
                              </ResponsiveText>
                            </View>
                          )}
                          <TouchableOpacity
                            style={[
                              registerStyles.loginButton,
                              (loading ||
                                otpCode.length !== 4) &&
                              registerStyles.loginButtonDisabled,
                            ]}
                            onPress={() => verifyOtp(otpCode)}
                            disabled={
                              loading || otpCode.length !== 4
                            }
                          >
                            <LinearGradient
                              colors={["#ffc90c", "#ffd700"]}
                              style={registerStyles.gradientButton}
                            >
                              <ResponsiveText
                                variant="button"
                                size="md"
                                weight="bold"
                                color={theme.colors.primary}
                                align="center"
                                truncateMode="single"
                                style={registerStyles.loginButtonText}
                              >
                                {loading ? t("verifying") : t("submit")}
                              </ResponsiveText>
                            </LinearGradient>
                          </TouchableOpacity>

                          {/* Back Button */}
                          <TouchableOpacity
                            style={[
                              registerStyles.backButton,
                              { alignSelf: "center" },
                            ]}
                            onPress={handleBackButton}
                          >
                            <Ionicons
                              name="arrow-back"
                              size={isSmallScreen ? 18 : 20}
                              color={theme.colors.primary}
                            />
                            <ResponsiveText
                              variant="caption"
                              size="sm"
                              color={theme.colors.primary}
                              align="center"
                              truncateMode="double"
                              inRow={true}
                              style={registerStyles.backButtonText}
                            >
                              {t("backToMobile")}
                            </ResponsiveText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </ScrollView>
            </KeyboardAvoidingView>
            {!isKeyboardVisible && (
              <TouchableOpacity
                onPress={() => Linking.openURL("https://nexoo.ai")}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  bottom: insets.bottom + 10,
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

          {/* Invalid Mobile Modal */}
          <InvalidMobileModal
            visible={showInvalidMobileModal}
            onClose={() => setShowInvalidMobileModal(false)}
            onCreateAccount={() => {
              logger.log("🔍 Login - Creating account with mobile:", mobile);
              setShowInvalidMobileModal(false);
              // Test with hardcoded mobile number to see if the issue is with the mobile state
              const testMobile = mobile || "9876543210";
              logger.log("🔍 Login - Using mobile for navigation:", testMobile);
              router.push({
                pathname: "/userBasicDetails",
                params: { mobile: testMobile },
              });
            }}
            mobileNumber={mobile}
          />

          {/* Debug Modal */}
          <DebugModal
            visible={showDebugModal}
            onClose={() => setShowDebugModal(false)}
            storageData={debugStorageData}
            onRefreshToken={handleRefreshToken}
            isRefreshing={isRefreshingToken}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

// Modal Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flex: 0, // Prevent flex from taking full height
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 400, // Limit scrollable area
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGrey,
  },
  modalIconContainer: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textDark,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.mediumGrey,
    textAlign: "center",
    marginTop: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.mediumGrey,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  modalDetails: {
    backgroundColor: theme.colors.additional.formBg,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWhite,
    minHeight: 50,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButton: {
    backgroundColor: theme.colors.additional.formBg,
    borderRightWidth: 0.5,
    borderRightColor: theme.colors.additional.formBorder,
  },
  createButton: {
    backgroundColor: theme.colors.additional.buttonOrange,
    borderLeftWidth: 0.5,
    borderLeftColor: theme.colors.additional.formBorder,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.additional.formText,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.white,
  },
  debugModalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  debugModalContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    elevation: 8,
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  debugModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.additional.formBorder,
  },
  debugModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.additional.formTextDark,
  },
  debugCloseButton: {
    padding: 8,
  },
  debugModalContent: {
    padding: 20,
  },
  debugEmptyText: {
    fontSize: 16,
    color: theme.colors.additional.formText,
    textAlign: "center",
    paddingVertical: 20,
  },
  debugItemContainer: {
    marginBottom: 15,
  },
  debugItemKey: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginBottom: 5,
  },
  debugItemValue: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  debugActionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f8f9fa",
  },
  debugActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  debugActionButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  debugActionButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  debugActionButtonTextDisabled: {
    color: "#999999",
  },
  numberBadge: {
    backgroundColor: "rgba(133, 1, 17, 0.05)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(133, 1, 17, 0.2)",
    alignSelf: "center",
  },
  numberBadgeText: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 16,
  },
});

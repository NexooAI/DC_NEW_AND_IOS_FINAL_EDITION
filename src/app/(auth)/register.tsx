import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Linking,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter, useLocalSearchParams } from "expo-router";
import PhoneInput from "@/components/PhoneInputs";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { registerStyles } from "../../_styles/registerStyles";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/contexts/LanguageSwitcher";
import { AppLocale } from "@/i18n";
import useGlobalStore from "@/store/global.store";

import { logger } from "@/utils/logger";
const OTP_RESEND_LIMIT = 3;
const INITIAL_TIMER = 20;

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
        source={{ uri: theme.images.translate.malayalam }}
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

// Error Alert Component (matching login)
const ErrorAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <View style={registerStyles.errorAlert}>
    <View style={registerStyles.errorContent}>
      <Ionicons name="alert-circle" size={24} color={COLORS.white} />
      <Text style={registerStyles.errorMessage}>{message}</Text>
    </View>
    <TouchableOpacity onPress={onClose} style={registerStyles.closeButton}>
      <Ionicons name="close" size={24} color={COLORS.white} />
    </TouchableOpacity>
  </View>
);

export default function Register() {
  const { t } = useTranslation();
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pins, setPins] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(0);
  const [resendCount, setResendCount] = useState(OTP_RESEND_LIMIT);
  const [showOtp, setShowOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useGlobalStore();
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Add useEffect to handle pre-filled mobile number
  useEffect(() => {
    if (params.mobile) {
      setMobile(params.mobile as string);
    }
  }, [params]);

  const startTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(INITIAL_TIMER);
    intervalRef.current = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
  };

  const hideErrorAlert = () => {
    setShowError(false);
  };

  const handleGetOtp = async () => {
    const indianMobilePattern = /^[6-9]\d{9}$/;

    if (!mobile || !indianMobilePattern.test(mobile)) {
      showErrorAlert(t("pleaseEnterValidIndianMobile"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setResendCount(OTP_RESEND_LIMIT); // User has OTP_RESEND_LIMIT resend attempts left
        startTimer();
        Alert.alert(t("success"), t("otpResentSuccessfully"));
      } else {
        throw new Error(data?.error || t("failedToSendOtp"));
      }
    } catch (error: any) {
      let message = t("anErrorOccurred");
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      if (message.toLowerCase().includes(t("alreadyRegistered"))) {
        Alert.alert(t("accountExists"), t("accountExistsMessage"), [
          { text: t("ok"), onPress: () => router.push("/login") },
        ]);
      } else {
        Alert.alert(t("registrationFailed"), message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCount <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/mobile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile }),
      });

      if (response.ok) {
        setResendCount((prev) => prev - 1);
        startTimer();
        setPins(["", "", "", ""]);
        Alert.alert(t("success"), t("otpResentSuccessfully"));
      } else {
        const data = await response.json();
        throw new Error(data?.error || t("failedToResendOtp"));
      }
    } catch (error: any) {
      let message = t("anErrorOccurred");
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      Alert.alert(t("resendOtpFailed"), message);
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (text: string, index: number) => {
    const newPins = [...pins];
    newPins[index] = text;
    setPins(newPins);

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
    }
  };

  const handleVerifyOtp = async () => {
    const otp = pins.join("");
    if (otp.length !== 4) {
      showErrorAlert(t("pleaseEnterCompleteOtp"));
      return;
    }
    logger.log("handle otp");
    setLoading(true);
    try {
      const response = await fetch(`${theme.baseUrl}/register/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobile_number: mobile, otp }),
      });

      const data = await response.json();
      logger.log("handle data", data);
      if (
        response.ok &&
        data.message &&
        data.message.toLowerCase().includes("otp verified successfully")
      ) {
        // await SecureStore.setItemAsync("authToken", data.token);
        router.push({
          pathname: "/(auth)/userBasicDetails",
          params: { mobile },
        });
        setPins(["", "", "", ""]);
      } else {
        logger.log("failedToVerifyOtp");
        Alert.alert(t("error"), data?.message || t("failedToVerifyOtp"));
      }
    } catch (error: any) {
      logger.log("alert");
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("failedToVerifyOtp")
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        setMobile("");
        setOtpSent(false);
        setLoading(false);
        setTimer(INITIAL_TIMER);
        setResendCount(OTP_RESEND_LIMIT);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [])
  );

  useEffect(() => {
    let countdown: NodeJS.Timeout;
    if (otpSent && timer > 0) {
      countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(countdown);
  }, [otpSent, timer]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleBackButton = () => {
    if (otpSent) {
      // If OTP fields are showing, hide them and go back to mobile input
      setOtpSent(false);
      setPins(["", "", "", ""]);
      setTimer(0);
      setResendCount(OTP_RESEND_LIMIT);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      // If mobile input is showing, navigate back to previous route
      router.back();
    }
  };

  return (
    <SafeAreaView style={registerStyles.container}>
      <ImageBackground
        source={{ uri: theme.image.bg_image }}
        style={registerStyles.backgroundImage}
      >
        {/* Dark overlay for background */}
        <View style={registerStyles.darkOverlay} />
        <LinearGradient
          colors={[
            "rgba(32, 1, 1, 0.55)",
            "rgba(167, 0, 0, 0)",
            "rgba(118, 1, 1, 0)",
          ]}
          style={registerStyles.gradient}
        >
          <SimpleLanguageSwitcher />
          {showError && (
            <ErrorAlert message={errorMessage} onClose={hideErrorAlert} />
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={registerStyles.keyboardAvoidingView}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
          >
            <ScrollView
              contentContainerStyle={registerStyles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={registerStyles.logoContainer}>
                <Image
                  source={{ uri: theme.images.auth.logo }}
                  style={registerStyles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={registerStyles.formContainer}>
                <View style={registerStyles.cardContainer}>
                  {/* Base fog layer */}
                  <LinearGradient
                    colors={[
                      "rgba(6, 2, 2, 0.78)",
                      "rgba(34, 0, 0, 0.35)",
                      "rgba(31, 3, 3, 0.54)",
                    ]}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Top fog highlight */}
                  <LinearGradient
                    colors={["rgba(10, 2, 2, 0.38)", "rgba(76, 63, 63, 0.74)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Bottom fog highlight */}
                  <LinearGradient
                    colors={["rgba(0, 0, 0, 0.44)", "rgba(0, 0, 0, 0.28)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {/* Content */}
                  <View style={registerStyles.cardContent}>
                    <Text style={registerStyles.pageTitle}>
                      {t("createAccount")}
                    </Text>
                    <Text style={registerStyles.subtitle}>
                      {t("joinUsToStartYourJourney")}
                    </Text>

                    {!otpSent ? (
                      <>
                        <View style={registerStyles.inputContainer}>
                          <PhoneInput
                            value={mobile}
                            onChangeText={setMobile}
                            loading={loading}
                          />
                        </View>
                        <TouchableOpacity
                          style={[
                            registerStyles.loginButton,
                            loading && registerStyles.loginButtonDisabled,
                          ]}
                          onPress={handleGetOtp}
                          disabled={loading}
                        >
                          <LinearGradient
                            colors={[COLORS.secondary, COLORS.gold]}
                            style={registerStyles.gradientButton}
                          >
                            <Text style={registerStyles.loginButtonText}>
                              {loading ? t("sending") : t("getOtp")}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <View style={registerStyles.footer}>
                          <Text style={registerStyles.footerText}>
                            {t("alreadyHaveAccount")}{" "}
                          </Text>
                          <TouchableOpacity
                            onPress={() => router.push("/login")}
                          >
                            <Text style={registerStyles.footerLink}>
                              {t("login")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      <View style={registerStyles.otpContainer}>
                        <Text style={registerStyles.otpTitle}>
                          {t("enterOtp")}
                        </Text>
                        <Text style={registerStyles.otpSentText}>
                          {t("otpSentTo")}{" "}
                          {mobile.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")}
                        </Text>

                        <View style={registerStyles.otpInputsWrapper}>
                          <View style={registerStyles.otpInputsContainer}>
                            {pins.map((pin, index) => (
                              <TextInput
                                key={index}
                                ref={inputRefs[index]}
                                style={registerStyles.otpInput}
                                keyboardType="numeric"
                                maxLength={1}
                                value={pin}
                                onChangeText={(text) =>
                                  handlePinChange(text, index)
                                }
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                secureTextEntry={!showOtp}
                                textContentType="oneTimeCode"
                                autoComplete="sms-otp"
                              />
                            ))}
                          </View>
                          <TouchableOpacity
                            onPress={() => setShowOtp((prev) => !prev)}
                            style={registerStyles.eyeButton}
                          >
                            <Feather
                              name={showOtp ? "eye-off" : "eye"}
                              size={24}
                              color={theme.colors.white}
                            />
                          </TouchableOpacity>
                        </View>

                        <View style={registerStyles.timerContainer}>
                          <Ionicons
                            name="time-outline"
                            size={20}
                            color={theme.colors.white}
                          />
                          <Text style={registerStyles.timerText}>
                            {t("resendIn")} {timer}s
                          </Text>
                        </View>

                        {timer === 0 && resendCount > 0 && (
                          <TouchableOpacity
                            onPress={handleResendOtp}
                            style={registerStyles.resendButton}
                          >
                            <Text style={registerStyles.resendText}>
                              {t("resendOTP")} ({resendCount} {t("left")})
                            </Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            registerStyles.loginButton,
                            loading && registerStyles.loginButtonDisabled,
                          ]}
                          onPress={handleVerifyOtp}
                          disabled={loading || pins.includes("")}
                        >
                          <LinearGradient
                            colors={[COLORS.secondary, COLORS.gold]}
                            style={registerStyles.gradientButton}
                          >
                            <Text style={registerStyles.loginButtonText}>
                              {loading ? t("verifying") : t("verifyOtp")}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
          <View style={registerStyles.poweredByContainer}>
            <Text style={registerStyles.poweredByText}>
              {t("poweredBy")}{" "}
              <Text
                style={{
                  textDecorationLine: "underline",
                  color: theme.colors.textLight,
                }}
                onPress={() => Linking.openURL("https://agnisofterp.com/")}
              >
                Agni Soft ERP
              </Text>
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

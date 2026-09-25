import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Keyboard,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthLogic, AuthStep } from "./useAuthLogic";
import InvalidMobileModal from "./InvalidMobileModal";
import SmoothPinInput from "./SmoothPinInput";
import { theme } from "@/constants/theme";
import { resolveImageSource } from "@/utils/imageUtils";
import { responsiveUtils } from "@/utils/responsiveUtils";
import LanguageSelector from "@/components/LanguageSelector";
import useGlobalStore from "@/store/global.store";

const DEFAULT_BRAND_LOGO = require("../../../assets/images/logo_trans.png");

const { themeConfig } = require("@/constants/theme.config");
const { hp } = responsiveUtils;
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface AuthShellV2Props {
  initialStep?: AuthStep;
  initialMobile?: string;
}

export default function AuthShellV2({
  initialStep = "phone",
  initialMobile = "",
}: AuthShellV2Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const auth = useAuthLogic({ initialStep, initialMobile });

  // Animation values
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;


  // Smooth slide-up when keyboard opens on iOS only (Android handles resize natively)
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(sheetTranslateY, {
        toValue: -140,
        duration: e?.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardWillHide", (e) => {
      Animated.timing(sheetTranslateY, {
        toValue: 0,
        duration: e?.duration || 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Smooth fade transition between steps
  useEffect(() => {
    contentFadeAnim.setValue(0.3);
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [auth.step]);

  // Brand logo & name resolution: use transparent STT lotus logo
  const brandLogoSource =
    typeof themeConfig?.icon === "string" && themeConfig.icon.startsWith("http")
      ? { uri: themeConfig.icon }
      : resolveImageSource(themeConfig?.icon, DEFAULT_BRAND_LOGO);
  const brandName = theme.constants?.customerName || themeConfig?.customerName || "Sri Thanga Thamarai";
  const primaryColor = themeConfig?.primaryColor || theme.colors.primary || "#0e1e38";
  const providerName = themeConfig?.providerName || theme.constants?.providerName || "Agnisofterp";
  const providerUrl = themeConfig?.providerUrl || theme.constants?.providerUrl || "https://agnisofterp.com/";

  // Language display
  const getLanguageLabel = () => {
    switch (language) {
      case "ta": return "தமிழ்";
      case "te": return "తెలుగు";
      case "hi": return "हिन्दी";
      case "mal": return "മലയാളം";
      default: return "EN";
    }
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />

      {/* Language Switcher Button on Top Right */}
      <TouchableOpacity
        style={[styles.languageBtn, { top: insets.top + 10 }]}
        onPress={() => setShowLanguageModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="globe-outline" size={16} color="#d4af37" />
        <Text style={styles.languageText}>{getLanguageLabel()}</Text>
      </TouchableOpacity>

      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Synchronized Content Wrapper: Moves Logo and Sheet in perfect lockstep on iOS */}
      <Animated.View
        style={[
          styles.contentWrapper,
          { transform: [{ translateY: sheetTranslateY }] },
        ]}
      >
        {/* Top Section: Luxury Brand Showcase Positioned Above Bottom Sheet */}
        <View style={[styles.topSection, { backgroundColor: primaryColor, paddingTop: insets.top + 8 }]}>
          <LinearGradient
            colors={["rgba(14, 30, 56, 0.95)", "rgba(10, 20, 38, 0.98)"]}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Subtle patterned overlay */}
          <Image
            source={require("../../../assets/images/jewelry_pattern.png")}
            style={[StyleSheet.absoluteFillObject, styles.patternOverlay]}
            resizeMode="repeat"
          />

          {/* Logo and Brand Name */}
          <View style={styles.brandContainer}>
            <View style={styles.logoHaloWrapper}>
              <View style={styles.ambientGlow} />
              <View style={styles.logoRing}>
                <Image
                  source={brandLogoSource}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <Text style={styles.brandTitle} numberOfLines={1}>
              {brandName}
            </Text>
            <View style={styles.goldDivider}>
              <View style={styles.dividerLine} />
              <Ionicons name="sparkles" size={13} color="#d4af37" style={{ marginHorizontal: 8 }} />
              <View style={styles.dividerLine} />
            </View>
          </View>
        </View>

        {/* Bottom Section: Sliding Bottom Sheet (Hugs Content Height) */}
        <View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Pull handle indicator */}
          <View style={styles.handleBar} />

          <KeyboardAvoidingView
            behavior={undefined}
            style={{ width: "100%" }}
          >
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View style={{ opacity: contentFadeAnim }}>
              {/* ERROR BANNER */}
              {auth.error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorText}>{auth.error}</Text>
                  <TouchableOpacity onPress={auth.clearError}>
                    <Ionicons name="close" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* STEP 1: PHONE INPUT */}
              {auth.step === "phone" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("welcomeBack")}</Text>
                  <Text style={styles.subtitleText}>{t("loginSubtitle")}</Text>

                  {/* Phone Input Box */}
                  <View style={styles.phoneInputContainer}>
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryFlag}>🇮🇳</Text>
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <View style={styles.inputSeparator} />
                    <TextInput
                      style={styles.phoneTextInput}
                      placeholder={t("enterMobileNumber")}
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={auth.mobile}
                      onChangeText={(val) => {
                        auth.clearError();
                        auth.setMobile(val.replace(/[^0-9]/g, ""));
                      }}
                      autoFocus={false}
                    />
                    {auth.mobile.length > 0 && (
                      <TouchableOpacity
                        onPress={() => auth.setMobile("")}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Send OTP Primary Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                    onPress={() => auth.sendOtp()}
                    disabled={auth.loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {auth.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>{t("sendOtp")}</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={18}
                            color="#d4af37"
                            style={{ marginLeft: 8 }}
                          />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Register New Account Link */}
                  <TouchableOpacity
                    style={styles.switchAuthLink}
                    onPress={() => auth.goToRegister()}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchAuthText}>
                      {language === "ta" ? "புதியவரா? " : "Don't have an account? "}
                      <Text style={styles.switchAuthAction}>
                        {language === "ta" ? "கணக்கு உருவாக்கவும்" : "Sign Up"}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {auth.step === "otp" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("enterOtpTitle")}</Text>
                  <Text style={styles.subtitleText}>{t("otpSentTo")}</Text>
                  <Text style={styles.otpMobileText}>+91 {auth.mobile}</Text>

                  {/* 4-Box OTP Input */}
                  <SmoothPinInput
                    value={auth.otp}
                    onChangeText={auth.setOtp}
                    length={4}
                    secure={false}
                    autoFocus={true}
                    editable={!auth.loading}
                    onComplete={(code) => auth.verifyOtp(code)}
                    boxStyle={styles.pinBox}
                    boxFocusedStyle={styles.pinBoxFocused}
                    boxFilledStyle={styles.pinBoxFilled}
                    textStyle={styles.pinBoxText}
                    testID="auth-v2-otp-input"
                  />

                  {/* Timer & Resend Row */}
                  <View style={styles.timerRow}>
                    {auth.timer > 0 ? (
                      <Text style={styles.timerText}>
                        {t("resendOtpIn")} {auth.timer}s
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={auth.resendOtp}
                        disabled={auth.loading}
                        style={styles.resendBtn}
                      >
                        <Ionicons name="refresh" size={15} color="#d4af37" />
                        <Text style={styles.resendText}>{t("resendOtp")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Verify Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                    onPress={() => auth.verifyOtp()}
                    disabled={auth.loading || auth.otp.length !== 4}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {auth.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>{t("verifyOtp")}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back to Phone */}
                  <TouchableOpacity
                    style={styles.switchAuthLink}
                    onPress={auth.changeNumber}
                  >
                    <Text style={styles.switchAuthText}>
                      <Ionicons name="arrow-back" size={14} /> {t("changeNumber")}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: MPIN LOGIN */}
              {auth.step === "mpin" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>{t("enterMpinTitle")}</Text>
                  <View style={styles.phoneChangeRow}>
                    <Text style={[styles.subtitleText, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit>+91 {auth.mobile}</Text>
                    <TouchableOpacity onPress={auth.changeNumber} style={styles.changeBadge}>
                      <Text style={styles.changeBadgeText}>{t("changeNumber")}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* 4-Box Secure MPIN Input with Eye Toggle */}
                  <SmoothPinInput
                    value={auth.mpin}
                    onChangeText={auth.setMpin}
                    length={4}
                    secure={true}
                    allowToggleSecure={true}
                    autoFocus={true}
                    editable={!auth.loading}
                    onComplete={(code) => auth.loginWithMpin(code)}
                    boxStyle={styles.pinBox}
                    boxFocusedStyle={styles.pinBoxFocused}
                    boxFilledStyle={styles.pinBoxFilled}
                    textStyle={styles.pinBoxText}
                    testID="auth-v2-mpin-input"
                  />

                  {/* Forgot MPIN */}
                  <TouchableOpacity
                    style={styles.forgotMpinBtn}
                    onPress={() => auth.startForgotMpin()}
                  >
                    <Text style={styles.forgotMpinText}>{t("forgotMpin")}</Text>
                  </TouchableOpacity>

                  {/* Login with MPIN Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor }]}
                    onPress={() => auth.loginWithMpin()}
                    disabled={auth.loading || auth.mpin.length !== 4}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {auth.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit>{t("loginAction")}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 4: SET MPIN */}
              {auth.step === "set_mpin" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText} numberOfLines={1} adjustsFontSizeToFit>{t("setMpinTitle")}</Text>
                  <Text style={styles.subtitleText}>{t("enterMpinTitle")}</Text>

                  {/* Set PIN 4 boxes */}
                  <SmoothPinInput
                    value={auth.mpin}
                    onChangeText={auth.setMpin}
                    length={4}
                    secure={true}
                    allowToggleSecure={true}
                    autoFocus={true}
                    editable={!auth.loading}
                    boxStyle={styles.pinBox}
                    boxFocusedStyle={styles.pinBoxFocused}
                    boxFilledStyle={styles.pinBoxFilled}
                    textStyle={styles.pinBoxText}
                    testID="auth-v2-set-mpin-input"
                  />

                  <Text style={[styles.subtitleText, { marginTop: 16 }]}>
                    {t("confirmMpinTitle")}
                  </Text>

                  {/* Confirm PIN 4 boxes */}
                  <SmoothPinInput
                    value={auth.confirmMpin}
                    onChangeText={auth.setConfirmMpin}
                    length={4}
                    secure={true}
                    allowToggleSecure={true}
                    autoFocus={false}
                    editable={!auth.loading}
                    onComplete={() => {
                      if (auth.mpin.length === 4) {
                        auth.submitSetMpin();
                      }
                    }}
                    boxStyle={styles.pinBox}
                    boxFocusedStyle={styles.pinBoxFocused}
                    boxFilledStyle={styles.pinBoxFilled}
                    textStyle={styles.pinBoxText}
                    testID="auth-v2-confirm-mpin-input"
                  />

                  {/* Save MPIN Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor, marginTop: 24 }]}
                    onPress={() => auth.submitSetMpin()}
                    disabled={auth.loading || auth.mpin.length !== 4 || auth.confirmMpin.length !== 4}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {auth.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>{t("continueAction")}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 5: REGISTER */}
              {auth.step === "register" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("registerTitle")}</Text>
                  <Text style={styles.subtitleText}>{t("registerSubtitle")}</Text>

                  {/* Full Name */}
                  <View style={styles.textInputWrapper}>
                    <Feather name="user" size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.singleTextInput}
                      placeholder={t("fullNamePlaceholder")}
                      placeholderTextColor="#9ca3af"
                      value={auth.name}
                      onChangeText={(val) => {
                        auth.clearError();
                        auth.setName(val);
                      }}
                    />
                  </View>

                  {/* Mobile */}
                  <View style={[styles.textInputWrapper, { marginTop: 12 }]}>
                    <Feather name="phone" size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.singleTextInput}
                      placeholder={t("enterMobileNumber")}
                      placeholderTextColor="#9ca3af"
                      keyboardType="number-pad"
                      maxLength={10}
                      value={auth.mobile}
                      onChangeText={(val) => {
                        auth.clearError();
                        auth.setMobile(val.replace(/[^0-9]/g, ""));
                      }}
                    />
                  </View>

                  {/* Email */}
                  <View style={[styles.textInputWrapper, { marginTop: 12 }]}>
                    <Feather name="mail" size={18} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.singleTextInput}
                      placeholder={t("emailPlaceholder")}
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      value={auth.email}
                      onChangeText={(val) => {
                        auth.clearError();
                        auth.setEmail(val);
                      }}
                    />
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor, marginTop: 20 }]}
                    onPress={() => auth.submitRegister()}
                    disabled={auth.loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {auth.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>{t("continueAction")}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Back to Login */}
                  <TouchableOpacity
                    style={styles.switchAuthLink}
                    onPress={auth.goToLogin}
                  >
                    <Text style={styles.switchAuthText}>{t("alreadyHaveAccount")}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Trust Badge Banner */}
              <View style={styles.trustBadgeContainer}>
                <Ionicons name="shield-checkmark" size={16} color="#d4af37" />
                <Text style={styles.trustBadgeText}>{t("trustBadgeHallmark")}</Text>
              </View>

              {/* Terms and Privacy notice */}
              <Text style={styles.termsText}>{t("termsAgreementNotice")}</Text>

              {/* Dynamic Powered by Footer */}
              <View style={styles.poweredByContainer}>
                <Text style={styles.poweredByText}>
                  {t("poweredBy") || "Powered by"}{" "}
                  <Text
                    style={styles.poweredByLink}
                    onPress={() => Linking.openURL(providerUrl)}
                  >
                    {providerName}
                  </Text>
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>

      {/* Unregistered Mobile Confirmation Modal */}
      <InvalidMobileModal
        visible={auth.showInvalidModal}
        onClose={auth.closeInvalidModal}
        onCreateAccount={() =>
          auth.goToRegister(auth.invalidMobileNumber || auth.mobile)
        }
        mobileNumber={auth.invalidMobileNumber || auth.mobile}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e1e38",
    justifyContent: "space-between",
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-between",
  },
  languageBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  languageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  topSection: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    position: "relative",
    paddingBottom: 18,
    minHeight: 150,
  },
  patternOverlay: {
    opacity: 0.05,
    tintColor: "#ffffff",
  },
  brandContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    paddingHorizontal: 24,
  },
  logoHaloWrapper: {
    width: 82,
    height: 82,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(212, 175, 55, 0.22)",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(14, 30, 56, 0.85)",
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  brandLogo: {
    width: 60,
    height: 60,
    aspectRatio: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  goldDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    width: 100,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.4)",
  },
  bottomSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 10,
    maxHeight: "82%",
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  sheetContent: {
    paddingHorizontal: 26,
    paddingTop: 14,
    paddingBottom: 20,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  stepContainer: {
    width: "100%",
  },
  titleText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  subtitleText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    lineHeight: 20,
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    marginTop: 22,
  },
  countryCodeBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryFlag: {
    fontSize: 16,
    marginRight: 6,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  inputSeparator: {
    width: 1,
    height: 24,
    backgroundColor: "#d1d5db",
    marginHorizontal: 12,
  },
  phoneTextInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 1.2,
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    marginTop: 20,
    overflow: "hidden",
    shadowColor: "#0e1e38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  secondaryOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 10,
  },
  secondaryOptionText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  biometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  biometricText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 8,
  },
  switchAuthLink: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 8,
  },
  switchAuthText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4b5563",
  },
  switchAuthAction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0e1e38",
    textDecorationLine: "underline",
    textDecorationColor: "#d4af37",
  },
  phoneChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  changeBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#b45309",
  },
  boxInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    paddingHorizontal: 8,
  },
  pinBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  pinBoxFocused: {
    borderColor: "#d4af37",
    backgroundColor: "#fffdfa",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pinBoxFilled: {
    borderColor: "#0e1e38",
    backgroundColor: "#ffffff",
  },
  pinBoxText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0e1e38",
    textAlign: "center",
    width: "100%",
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },
  timerText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d4af37",
    marginLeft: 6,
  },
  forgotMpinBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
    paddingVertical: 4,
  },
  forgotMpinText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
  },
  textInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
  },
  inputIcon: {
    marginRight: 10,
  },
  singleTextInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },
  trustBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    backgroundColor: "#fefce8",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#854d0e",
    marginLeft: 6,
  },
  termsText: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  otpMobileText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
    marginBottom: 8,
  },
  poweredByContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    marginBottom: 4,
  },
  poweredByText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  poweredByLink: {
    color: "#d4af37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

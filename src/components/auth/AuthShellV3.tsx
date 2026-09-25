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
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthLogic, AuthStep } from "./useAuthLogic";
import { SmoothPinInput } from "./SmoothPinInput";
import InvalidMobileModal from "./InvalidMobileModal";
import { theme } from "@/constants/theme";
import { resolveImageSource } from "@/utils/imageUtils";
import LanguageSelector from "@/components/LanguageSelector";
import useGlobalStore from "@/store/global.store";

const DEFAULT_BRAND_LOGO = require("../../../assets/images/logo_trans.png");

const { themeConfig } = require("@/constants/theme.config");
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface AuthShellV3Props {
  initialStep?: AuthStep;
  initialMobile?: string;
}

export default function AuthShellV3({
  initialStep = "phone",
  initialMobile = "",
}: AuthShellV3Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const auth = useAuthLogic({ initialStep, initialMobile });

  const brandLogoSource =
    typeof themeConfig?.icon === "string" && themeConfig.icon.startsWith("http")
      ? { uri: themeConfig.icon }
      : resolveImageSource(themeConfig?.icon, DEFAULT_BRAND_LOGO);
  const brandName = theme.constants?.customerName || themeConfig?.customerName || "Sri Thanga Thamarai";
  const primaryColor = themeConfig?.primaryColor || "#0e1e38";
  const providerName = themeConfig?.providerName || theme.constants?.providerName || "Agnisofterp";
  const providerUrl = themeConfig?.providerUrl || theme.constants?.providerUrl || "https://agnisofterp.com/";

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
      <StatusBar barStyle="light-content" backgroundColor="#081121" />

      {/* Midnight Luxury Gradient Background */}
      <LinearGradient
        colors={["#081121", "#0e1e38", "#050b17"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative Gold Bokeh Orbs */}
      <View style={[styles.bokehOrb, { top: "10%", left: -50, width: 220, height: 220, backgroundColor: "rgba(212, 175, 55, 0.12)" }]} />
      <View style={[styles.bokehOrb, { bottom: "18%", right: -60, width: 260, height: 260, backgroundColor: "rgba(243, 192, 91, 0.09)" }]} />
      <View style={[styles.bokehOrb, { top: "45%", right: "20%", width: 140, height: 140, backgroundColor: "rgba(212, 175, 55, 0.07)" }]} />

      {/* Header with Language Selector */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
        <View style={{ width: 40 }} />
        <TouchableOpacity
          style={styles.frostedLangBtn}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={15} color="#d4af37" />
          <Text style={styles.frostedLangText}>{getLanguageLabel()}</Text>
        </TouchableOpacity>
      </View>

      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      <KeyboardAvoidingView
        behavior={undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Presentation */}
          <View style={styles.brandHero}>
            <View style={styles.goldGlowRing}>
              <Image source={brandLogoSource} style={styles.brandLogo} resizeMode="contain" />
            </View>
            <Text style={styles.brandNameText}>{brandName}</Text>
            <View style={styles.goldEmblemLine}>
              <View style={styles.goldLine} />
              <Ionicons name="diamond-outline" size={12} color="#d4af37" style={{ marginHorizontal: 8 }} />
              <View style={styles.goldLine} />
            </View>
          </View>



          {/* Frosted Glassmorphism Card */}
          <View style={styles.glassCard}>
            {/* Error Banner */}
            {auth.error ? (
              <View style={styles.errorGlassBanner}>
                <Ionicons name="alert-circle" size={17} color="#f87171" />
                <Text style={styles.errorGlassText}>{auth.error}</Text>
                <TouchableOpacity onPress={auth.clearError}>
                  <Ionicons name="close" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* STEP 1: PHONE INPUT */}
            {auth.step === "phone" && (
              <View>
                <Text style={styles.glassTitle}>{t("welcomeBack")}</Text>
                <Text style={styles.glassSubtitle}>{t("loginSubtitle")}</Text>

                {/* Mobile Input with Gold Rim */}
                <View style={styles.glassInputBox}>
                  <View style={styles.glassCountryPill}>
                    <Text style={{ fontSize: 14 }}>🇮🇳</Text>
                    <Text style={styles.glassCountryText}>+91</Text>
                  </View>
                  <View style={styles.verticalGlassDivider} />
                  <TextInput
                    style={styles.glassTextInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={auth.mobile}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setMobile(val.replace(/[^0-9]/g, ""));
                    }}
                  />
                  {auth.mobile.length > 0 && (
                    <TouchableOpacity onPress={() => auth.setMobile("")}>
                      <Ionicons name="close-circle" size={18} color="#64748b" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Gold Gradient Submit Button */}
                <TouchableOpacity
                  style={styles.goldGradButton}
                  onPress={() => auth.sendOtp()}
                  disabled={auth.loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f59e0b", "#d97706"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.goldGradInner}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <>
                        <Text style={styles.goldButtonText}>{t("sendOtp")}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#0e1e38" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.bottomLink}
                  onPress={() => auth.goToRegister()}
                >
                  <Text style={styles.bottomLinkText}>{t("newUserRegister")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {auth.step === "otp" && (
              <View>
                <Text style={styles.glassTitle}>{t("enterOtpTitle")}</Text>
                <Text style={styles.glassSubtitle}>{t("otpSentTo")}</Text>
                <Text style={styles.otpMobileTextV3}>+91 {auth.mobile}</Text>

                {/* 4-Box Glowing Cells */}
                <SmoothPinInput
                  value={auth.otp}
                  onChangeText={auth.setOtp}
                  onComplete={(code) => auth.verifyOtp(code)}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassBox}
                  boxFocusedStyle={styles.glassBoxFocused}
                  boxFilledStyle={styles.glassBoxFilled}
                  textStyle={styles.glassBoxText}
                  testID="otp-pin-input"
                />

                {/* Resend Timer */}
                <View style={styles.timerRowV3}>
                  {auth.timer > 0 ? (
                    <Text style={styles.timerTextV3}>
                      {t("resendOtpIn")} {auth.timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={auth.resendOtp} disabled={auth.loading}>
                      <Text style={styles.resendTextV3}>{t("resendOtp")}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={styles.goldGradButton}
                  onPress={() => auth.verifyOtp()}
                  disabled={auth.loading || auth.otp.length !== 4}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f59e0b", "#d97706"]}
                    style={styles.goldGradInner}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText} numberOfLines={1} adjustsFontSizeToFit>{t("verifyOtp")}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomLink} onPress={auth.changeNumber}>
                  <Text style={styles.bottomLinkText}>
                    <Ionicons name="arrow-back" size={13} /> {t("changeNumber")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: MPIN LOGIN */}
            {auth.step === "mpin" && (
              <View>
                <Text style={styles.glassTitle} numberOfLines={1} adjustsFontSizeToFit>{t("enterMpinTitle")}</Text>
                <View style={styles.rowBetween}>
                  <Text style={styles.glassSubtitle}>+91 {auth.mobile}</Text>
                  <TouchableOpacity onPress={auth.changeNumber} style={styles.glassBadge}>
                    <Text style={styles.glassBadgeText}>{t("changeNumber")}</Text>
                  </TouchableOpacity>
                </View>

                {/* 4-Box Glowing Secure MPIN with Eye Toggle */}
                <SmoothPinInput
                  value={auth.mpin}
                  onChangeText={auth.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  onComplete={(code) => auth.loginWithMpin(code)}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassBox}
                  boxFocusedStyle={styles.glassBoxFocused}
                  boxFilledStyle={styles.glassBoxFilled}
                  textStyle={styles.glassBoxText}
                  testID="mpin-pin-input"
                />

                {/* Forgot MPIN */}
                <TouchableOpacity
                  style={styles.forgotBtnV3}
                  onPress={() => auth.startForgotMpin()}
                >
                  <Text style={styles.forgotTextV3}>{t("forgotMpin")}</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={styles.goldGradButton}
                  onPress={() => auth.loginWithMpin()}
                  disabled={auth.loading || auth.mpin.length !== 4}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f59e0b", "#d97706"]}
                    style={styles.goldGradInner}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText} numberOfLines={1} adjustsFontSizeToFit>{t("loginAction")}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {auth.isBiometricsEnabled && (
                  <TouchableOpacity
                    style={styles.frostedBiometricBtn}
                    onPress={auth.handleBiometricAuth}
                  >
                    <MaterialCommunityIcons name="fingerprint" size={22} color="#d4af37" />
                    <Text style={styles.frostedBiometricText}>{t("biometricLogin")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* STEP 4: SET MPIN */}
            {auth.step === "set_mpin" && (
              <View>
                <Text style={styles.glassTitle} numberOfLines={1} adjustsFontSizeToFit>{t("setMpinTitle")}</Text>
                <Text style={styles.glassSubtitle}>{t("enterMpinTitle")}</Text>

                {/* First 4-box PIN */}
                <SmoothPinInput
                  value={auth.mpin}
                  onChangeText={auth.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassBox}
                  boxFocusedStyle={styles.glassBoxFocused}
                  boxFilledStyle={styles.glassBoxFilled}
                  textStyle={styles.glassBoxText}
                  testID="set-mpin-pin-input"
                />

                <Text style={[styles.glassSubtitle, { marginTop: 18 }]}>{t("confirmMpinTitle")}</Text>

                {/* Confirm 4-box PIN */}
                <SmoothPinInput
                  value={auth.confirmMpin}
                  onChangeText={auth.setConfirmMpin}
                  secure={true}
                  allowToggleSecure={true}
                  autoFocus={false}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassBox}
                  boxFocusedStyle={styles.glassBoxFocused}
                  boxFilledStyle={styles.glassBoxFilled}
                  textStyle={styles.glassBoxText}
                  testID="confirm-mpin-pin-input"
                />

                {/* Save MPIN Button */}
                <TouchableOpacity
                  style={[styles.goldGradButton, { marginTop: 24 }]}
                  onPress={() => auth.submitSetMpin()}
                  disabled={auth.loading || auth.mpin.length !== 4 || auth.confirmMpin.length !== 4}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f59e0b", "#d97706"]}
                    style={styles.goldGradInner}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText} numberOfLines={1} adjustsFontSizeToFit>{t("continueAction")}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 5: REGISTER */}
            {auth.step === "register" && (
              <View>
                <Text style={styles.glassTitle}>{t("registerTitle")}</Text>
                <Text style={styles.glassSubtitle}>{t("registerSubtitle")}</Text>

                <View style={styles.glassInputBox}>
                  <Feather name="user" size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.glassTextInput}
                    placeholder={t("fullNamePlaceholder")}
                    placeholderTextColor="#64748b"
                    value={auth.name}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setName(val);
                    }}
                  />
                </View>

                <View style={[styles.glassInputBox, { marginTop: 12 }]}>
                  <Feather name="phone" size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.glassTextInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={auth.mobile}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setMobile(val.replace(/[^0-9]/g, ""));
                    }}
                  />
                </View>

                <View style={[styles.glassInputBox, { marginTop: 12 }]}>
                  <Feather name="mail" size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.glassTextInput}
                    placeholder={t("emailPlaceholder")}
                    placeholderTextColor="#64748b"
                    keyboardType="email-address"
                    value={auth.email}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setEmail(val);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.goldGradButton, { marginTop: 20 }]}
                  onPress={() => auth.submitRegister()}
                  disabled={auth.loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f59e0b", "#d97706"]}
                    style={styles.goldGradInner}
                  >
                    {auth.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText}>{t("continueAction")}</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomLink} onPress={auth.goToLogin}>
                  <Text style={styles.bottomLinkText}>{t("alreadyHaveAccount")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Hallmark Trust Badge */}
            <View style={styles.hallmarkBadge}>
              <Ionicons name="shield-checkmark" size={15} color="#d4af37" />
              <Text style={styles.hallmarkText}>{t("trustBadgeHallmark")}</Text>
            </View>

            {/* Terms notice */}
            <Text style={styles.glassTermsText}>{t("termsAgreementNotice")}</Text>

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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    backgroundColor: "#081121",
  },
  bokehOrb: {
    position: "absolute",
    borderRadius: 200,
    filter: "blur(40px)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  frostedLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  frostedLangText: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexGrow: 1,
  },
  brandHero: {
    alignItems: "center",
    marginVertical: 18,
  },
  goldGlowRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  brandLogo: {
    width: 95,
    height: 95,
  },
  brandNameText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  goldEmblemLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    width: 120,
  },
  goldLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.35)",
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentTabActive: {
    backgroundColor: "#d4af37",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  segmentText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  segmentTextActive: {
    color: "#0e1e38",
    fontWeight: "800",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  glassTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  glassSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    marginTop: 4,
    lineHeight: 18,
  },
  errorGlassBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorGlassText: {
    flex: 1,
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  glassInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.4)",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 56,
    marginTop: 20,
  },
  glassCountryPill: {
    flexDirection: "row",
    alignItems: "center",
  },
  glassCountryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
    marginLeft: 4,
  },
  verticalGlassDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: 12,
  },
  glassTextInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 1.1,
  },
  goldGradButton: {
    height: 54,
    borderRadius: 16,
    marginTop: 20,
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  goldGradInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  goldButtonText: {
    color: "#0e1e38",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  frostedBiometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  frostedBiometricText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
    marginLeft: 8,
  },
  bottomLink: {
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 6,
  },
  bottomLinkText: {
    color: "#d4af37",
    fontSize: 14,
    fontWeight: "700",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  glassBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  glassBadgeText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    paddingHorizontal: 4,
  },
  glassBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  glassBoxFocused: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  glassBoxFilled: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(14, 30, 56, 0.9)",
  },
  glassBoxText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    width: "100%",
  },
  timerRowV3: {
    alignItems: "center",
    marginTop: 16,
  },
  timerTextV3: {
    color: "#94a3b8",
    fontSize: 13,
  },
  resendTextV3: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "700",
  },
  forgotBtnV3: {
    alignSelf: "flex-end",
    marginTop: 12,
    paddingVertical: 4,
  },
  forgotTextV3: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
  },
  hallmarkBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    alignSelf: "center",
  },
  hallmarkText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },
  glassTermsText: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
  otpMobileTextV3: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginTop: 4,
    marginBottom: 10,
  },
  poweredByContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  poweredByText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  poweredByLink: {
    color: "#d4af37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

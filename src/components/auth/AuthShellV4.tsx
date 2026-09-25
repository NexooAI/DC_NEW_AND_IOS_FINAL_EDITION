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
  ImageBackground,
  ActivityIndicator,
  StatusBar,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
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

interface AuthShellV4Props {
  initialStep?: AuthStep;
  initialMobile?: string;
}

export default function AuthShellV4({
  initialStep = "phone",
  initialMobile = "",
}: AuthShellV4Props) {
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
      case "mal": return "മലയാളம்";
      default: return "EN";
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed Luxury Visual with Editorial Scrim */}
      <ImageBackground
        source={require("../../../assets/images/bg_new.jpg")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <LinearGradient
          colors={[
            "rgba(14, 30, 56, 0.75)",
            "rgba(10, 20, 38, 0.92)",
            "rgba(6, 12, 23, 0.98)",
          ]}
          locations={[0, 0.45, 0.85]}
          style={StyleSheet.absoluteFillObject}
        />
      </ImageBackground>

      {/* Top Bar with Language Selector */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.brandPill}>
          <Image source={brandLogoSource} style={styles.pillLogo} resizeMode="contain" />
          <Text style={styles.pillBrandName} numberOfLines={1}>{brandName}</Text>
        </View>

        <TouchableOpacity
          style={styles.minimalLangBtn}
          onPress={() => setShowLanguageModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="globe-outline" size={14} color="#d4af37" />
          <Text style={styles.minimalLangText}>{getLanguageLabel()}</Text>
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
          contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Editorial Headline */}
          <View style={styles.editorialHeader}>
            <Text style={styles.editorialEyebrow}>FINE JEWELLERY & GOLD SAVINGS</Text>
            <Text style={styles.editorialTitle}>{t("welcomeBack")}</Text>
            <Text style={styles.editorialSubtitle}>{t("loginSubtitle")}</Text>
          </View>

          {/* Minimalist White Card */}
          <View style={styles.fashionCard}>
            {auth.error ? (
              <View style={styles.errorPill}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorPillText}>{auth.error}</Text>
                <TouchableOpacity onPress={auth.clearError}>
                  <Ionicons name="close" size={15} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* STEP 1: PHONE & CHANNEL SELECTION */}
            {auth.step === "phone" && (
              <View>
                {/* Minimalist Pill Input */}
                <View style={styles.pillInputWrapper}>
                  <Text style={styles.flagCode}>+91</Text>
                  <View style={styles.verticalBar} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#94a3b8"
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
                      <Ionicons name="close-circle" size={17} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Channel Selector: SMS vs WhatsApp */}
                <View style={styles.channelRow}>
                  <TouchableOpacity
                    style={[
                      styles.channelPill,
                      auth.channel === "sms" && styles.channelPillActive,
                    ]}
                    onPress={() => auth.setChannel("sms")}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={15}
                      color={auth.channel === "sms" ? "#0e1e38" : "#64748b"}
                    />
                    <Text
                      style={[
                        styles.channelText,
                        auth.channel === "sms" && styles.channelTextActive,
                      ]}
                    >
                      {t("sendOtpViaSms")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.channelPill,
                      auth.channel === "whatsapp" && styles.channelPillActiveWhatsapp,
                    ]}
                    onPress={() => auth.setChannel("whatsapp")}
                    activeOpacity={0.8}
                  >
                    <FontAwesome5
                      name="whatsapp"
                      size={16}
                      color={auth.channel === "whatsapp" ? "#ffffff" : "#16a34a"}
                    />
                    <Text
                      style={[
                        styles.channelText,
                        auth.channel === "whatsapp" && styles.channelTextActiveWhatsapp,
                      ]}
                    >
                      {t("sendOtpViaWhatsapp")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Action Button */}
                <TouchableOpacity
                  style={[styles.fashionPrimaryBtn, { backgroundColor: primaryColor }]}
                  onPress={() => auth.sendOtp()}
                  disabled={auth.loading}
                  activeOpacity={0.88}
                >
                  {auth.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <>
                      <Text style={styles.fashionBtnText}>{t("sendOtp")}</Text>
                      <Ionicons name="arrow-forward" size={17} color="#d4af37" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Register Link */}
                <TouchableOpacity
                  style={styles.centerLink}
                  onPress={() => auth.goToRegister()}
                >
                  <Text style={styles.centerLinkText}>{t("newUserRegister")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP VERIFY */}
            {auth.step === "otp" && (
              <View>
                <Text style={styles.fashionStepTitle}>{t("enterOtpTitle")}</Text>
                <Text style={styles.fashionStepSub}>{t("otpSentTo")}</Text>
                <Text style={styles.otpMobileTextV4}>+91 {auth.mobile}</Text>

                <SmoothPinInput
                  value={auth.otp}
                  onChangeText={auth.setOtp}
                  onComplete={(code) => auth.verifyOtp(code)}
                  containerStyle={styles.fashionOtpRow}
                  boxStyle={styles.fashionOtpBox}
                  boxFocusedStyle={styles.fashionOtpBoxFocused}
                  boxFilledStyle={styles.fashionOtpBoxFilled}
                  textStyle={styles.fashionOtpBoxText}
                  testID="otp-pin-input"
                />

                <View style={styles.fashionTimerRow}>
                  {auth.timer > 0 ? (
                    <Text style={styles.fashionTimerText}>
                      {t("resendOtpIn")} {auth.timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={auth.resendOtp} disabled={auth.loading}>
                      <Text style={styles.fashionResendText}>{t("resendOtp")}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.fashionPrimaryBtn, { backgroundColor: primaryColor }]}
                  onPress={() => auth.verifyOtp()}
                  disabled={auth.loading || auth.otp.length !== 4}
                  activeOpacity={0.88}
                >
                  {auth.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t("verifyOtp")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.centerLink} onPress={auth.changeNumber}>
                  <Text style={styles.centerLinkText}>
                    <Ionicons name="arrow-back" size={13} /> {t("changeNumber")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: MPIN LOGIN */}
            {auth.step === "mpin" && (
              <View>
                <Text style={styles.fashionStepTitle} numberOfLines={1} adjustsFontSizeToFit>{t("enterMpinTitle")}</Text>
                <View style={styles.changePhoneBar}>
                  <Text style={styles.fashionStepSub}>+91 {auth.mobile}</Text>
                  <TouchableOpacity onPress={auth.changeNumber} style={styles.fashionChangePill}>
                    <Text style={styles.fashionChangePillText}>{t("changeNumber")}</Text>
                  </TouchableOpacity>
                </View>

                {/* 4-Box Secure MPIN with Eye Toggle */}
                <SmoothPinInput
                  value={auth.mpin}
                  onChangeText={auth.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  onComplete={(code) => auth.loginWithMpin(code)}
                  containerStyle={styles.fashionOtpRow}
                  boxStyle={styles.fashionOtpBox}
                  boxFocusedStyle={styles.fashionOtpBoxFocused}
                  boxFilledStyle={styles.fashionOtpBoxFilled}
                  textStyle={styles.fashionOtpBoxText}
                  testID="mpin-pin-input"
                />

                <TouchableOpacity
                  style={styles.fashionForgotBtn}
                  onPress={() => auth.startForgotMpin()}
                >
                  <Text style={styles.fashionForgotText}>{t("forgotMpin")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.fashionPrimaryBtn, { backgroundColor: primaryColor }]}
                  onPress={() => auth.loginWithMpin()}
                  disabled={auth.loading || auth.mpin.length !== 4}
                  activeOpacity={0.88}
                >
                  {auth.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText} numberOfLines={1} adjustsFontSizeToFit>{t("loginAction")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: SET MPIN */}
            {auth.step === "set_mpin" && (
              <View>
                <Text style={styles.fashionStepTitle} numberOfLines={1} adjustsFontSizeToFit>{t("setMpinTitle")}</Text>
                <Text style={styles.fashionStepSub}>{t("enterMpinTitle")}</Text>

                <SmoothPinInput
                  value={auth.mpin}
                  onChangeText={auth.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  containerStyle={styles.fashionOtpRow}
                  boxStyle={styles.fashionOtpBox}
                  boxFocusedStyle={styles.fashionOtpBoxFocused}
                  boxFilledStyle={styles.fashionOtpBoxFilled}
                  textStyle={styles.fashionOtpBoxText}
                  testID="set-mpin-pin-input"
                />

                <Text style={[styles.fashionStepSub, { marginTop: 18 }]}>{t("confirmMpinTitle")}</Text>

                <SmoothPinInput
                  value={auth.confirmMpin}
                  onChangeText={auth.setConfirmMpin}
                  secure={true}
                  allowToggleSecure={true}
                  autoFocus={false}
                  containerStyle={styles.fashionOtpRow}
                  boxStyle={styles.fashionOtpBox}
                  boxFocusedStyle={styles.fashionOtpBoxFocused}
                  boxFilledStyle={styles.fashionOtpBoxFilled}
                  textStyle={styles.fashionOtpBoxText}
                  testID="confirm-mpin-pin-input"
                />

                <TouchableOpacity
                  style={[styles.fashionPrimaryBtn, { backgroundColor: primaryColor, marginTop: 22 }]}
                  onPress={() => auth.submitSetMpin()}
                  disabled={auth.loading || auth.mpin.length !== 4 || auth.confirmMpin.length !== 4}
                  activeOpacity={0.88}
                >
                  {auth.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText}>{t("continueAction")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 5: REGISTER */}
            {auth.step === "register" && (
              <View>
                <Text style={styles.fashionStepTitle}>{t("registerTitle")}</Text>
                <Text style={styles.fashionStepSub}>{t("registerSubtitle")}</Text>

                <View style={styles.pillInputWrapper}>
                  <Feather name="user" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("fullNamePlaceholder")}
                    placeholderTextColor="#94a3b8"
                    value={auth.name}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setName(val);
                    }}
                  />
                </View>

                <View style={[styles.pillInputWrapper, { marginTop: 12 }]}>
                  <Feather name="phone" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={auth.mobile}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setMobile(val.replace(/[^0-9]/g, ""));
                    }}
                  />
                </View>

                <View style={[styles.pillInputWrapper, { marginTop: 12 }]}>
                  <Feather name="mail" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("emailPlaceholder")}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    value={auth.email}
                    onChangeText={(val) => {
                      auth.clearError();
                      auth.setEmail(val);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.fashionPrimaryBtn, { backgroundColor: primaryColor, marginTop: 20 }]}
                  onPress={() => auth.submitRegister()}
                  disabled={auth.loading}
                  activeOpacity={0.88}
                >
                  {auth.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText}>{t("continueAction")}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.centerLink} onPress={auth.goToLogin}>
                  <Text style={styles.centerLinkText}>{t("alreadyHaveAccount")}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Twin Trust Badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustItem}>
                <Ionicons name="ribbon-outline" size={15} color="#d4af37" />
                <Text style={styles.trustItemText}>{t("trustBadgeHallmark")}</Text>
              </View>
            </View>

            <Text style={styles.fashionTerms}>{t("termsAgreementNotice")}</Text>

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
    backgroundColor: "#060c17",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(14, 30, 56, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  pillLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  pillBrandName: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "700",
  },
  minimalLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  minimalLangText: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexGrow: 1,
  },
  editorialHeader: {
    marginBottom: 20,
  },
  editorialEyebrow: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 6,
  },
  editorialTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  editorialSubtitle: {
    color: "#cbd5e1",
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  fashionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorPillText: {
    flex: 1,
    color: "#b91c1c",
    fontSize: 13,
    marginHorizontal: 8,
  },
  pillInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    height: 56,
  },
  flagCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  verticalBar: {
    width: 1,
    height: 22,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 12,
  },
  pillInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    letterSpacing: 1.1,
  },
  channelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  channelPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "transparent",
  },
  channelPillActive: {
    backgroundColor: "#fef9c3",
    borderColor: "#eab308",
  },
  channelPillActiveWhatsapp: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
  },
  channelText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginLeft: 6,
  },
  channelTextActive: {
    color: "#854d0e",
    fontWeight: "700",
  },
  channelTextActiveWhatsapp: {
    color: "#ffffff",
    fontWeight: "700",
  },
  fashionPrimaryBtn: {
    height: 54,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#0e1e38",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fashionBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  fashionSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 10,
  },
  fashionSecondaryText: {
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  fashionBiometricBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  fashionBiometricText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginLeft: 8,
  },
  centerLink: {
    alignItems: "center",
    marginTop: 16,
    paddingVertical: 6,
  },
  centerLinkText: {
    color: "#d4af37",
    fontSize: 14,
    fontWeight: "700",
  },
  fashionStepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
  },
  fashionStepSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  changePhoneBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  fashionChangePill: {
    backgroundColor: "#fef9c3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  fashionChangePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#854d0e",
  },
  fashionOtpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
    paddingHorizontal: 4,
  },
  fashionOtpBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  fashionOtpBoxFocused: {
    borderColor: "#d4af37",
    backgroundColor: "#fffdfa",
  },
  fashionOtpBoxFilled: {
    borderColor: "#0e1e38",
    backgroundColor: "#ffffff",
  },
  fashionOtpBoxText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0e1e38",
    textAlign: "center",
    width: "100%",
  },
  fashionTimerRow: {
    alignItems: "center",
    marginTop: 16,
  },
  fashionTimerText: {
    color: "#64748b",
    fontSize: 13,
  },
  fashionResendText: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "700",
  },
  fashionForgotBtn: {
    alignSelf: "flex-end",
    marginTop: 12,
  },
  fashionForgotText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  trustRow: {
    marginTop: 22,
    alignItems: "center",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fefce8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  trustItemText: {
    color: "#854d0e",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 6,
  },
  fashionTerms: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 14,
    lineHeight: 16,
  },
  otpMobileTextV4: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
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
    color: "#6b7280",
    fontWeight: "500",
  },
  poweredByLink: {
    color: "#d4af37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

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
  Modal,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { useRegisterLogic } from "./useRegisterLogic";
import { SmoothPinInput } from "./SmoothPinInput";
import { theme } from "@/constants/theme";
import { resolveImageSource } from "@/utils/imageUtils";
import LanguageSelector from "@/components/LanguageSelector";
import useGlobalStore from "@/store/global.store";

const DEFAULT_BRAND_LOGO = require("../../../assets/images/logo_trans.png");

const { themeConfig } = require("@/constants/theme.config");
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface RegisterShellV4Props {
  initialMobile?: string;
  initialReferral?: string;
}

export default function RegisterShellV4({
  initialMobile = "",
  initialReferral = "",
}: RegisterShellV4Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const reg = useRegisterLogic({ initialMobile, initialReferral });

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

  const selectedBranchName = (() => {
    if (reg.branches.length === 0) return t("loading") || "Loading branches...";
    const found = reg.branches.find((b) => Number(b.id) === Number(reg.selectedBranchId));
    return found ? found.branch_name : t("selectBranch") || "Select Home Branch *";
  })();

  return (
    <View style={styles.container}>
      {/* Editorial Scrim Background */}
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

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={reg.goToLogin} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
        </TouchableOpacity>

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

      <KeyboardAvoidingView behavior={undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editorialHeader}>
            <Text style={styles.editorialEyebrow}>FINE JEWELLERY & GOLD SAVINGS</Text>
            <Text style={styles.editorialTitle}>{t("createAccount") || "Create Account"}</Text>
            <Text style={styles.editorialSubtitle}>
              {t("registerSubtitle") || "Begin your distinguished gold journey"}
            </Text>
          </View>

          {/* Minimalist White Card */}
          <View style={styles.fashionCard}>
            {reg.error ? (
              <View style={styles.errorPill}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorPillText}>{reg.error}</Text>
                <TouchableOpacity onPress={reg.clearError}>
                  <Ionicons name="close" size={15} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* STEP 1: FORM */}
            {reg.step === "form" && (
              <View>
                {/* Mobile Input */}
                <View style={styles.pillInputWrapper}>
                  <Text style={styles.flagCode}>+91</Text>
                  <View style={styles.verticalBar} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={reg.mobile}
                    onChangeText={(val) => {
                      reg.clearError();
                      reg.setMobile(val.replace(/[^0-9]/g, ""));
                    }}
                  />
                </View>

                {/* Full Name */}
                <View style={[styles.pillInputWrapper, { marginTop: 12 }]}>
                  <Feather name="user" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("fullNamePlaceholder") || "Full Name *"}
                    placeholderTextColor="#94a3b8"
                    value={reg.name}
                    onChangeText={(val) => {
                      reg.clearError();
                      reg.setName(val);
                    }}
                  />
                </View>

                {/* Email */}
                <View style={[styles.pillInputWrapper, { marginTop: 12 }]}>
                  <Feather name="mail" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.pillInput}
                    placeholder={t("emailPlaceholder") || "Email Address *"}
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={reg.email}
                    onChangeText={(val) => {
                      reg.clearError();
                      reg.setEmail(val);
                    }}
                  />
                </View>

                {/* Branch Selection */}
                <TouchableOpacity
                  style={[
                    styles.pillInputWrapper,
                    { marginTop: 12 },
                    reg.isBranchDisabled && { opacity: 0.6 },
                  ]}
                  onPress={() => !reg.isBranchDisabled && setShowBranchModal(true)}
                  activeOpacity={0.7}
                  disabled={reg.isBranchDisabled}
                >
                  <Feather name="map-pin" size={16} color="#0e1e38" style={{ marginRight: 8 }} />
                  <Text
                    style={[
                      styles.pillBranchText,
                      !reg.selectedBranchId && { color: "#94a3b8" },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedBranchName}
                  </Text>
                  {!reg.isBranchDisabled && (
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  )}
                </TouchableOpacity>

                {/* Referral Code (Optional) */}
                <View style={[styles.pillInputWrapper, { marginTop: 12 }]}>
                  <Feather name="gift" size={16} color="#d4af37" style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.pillInput, { letterSpacing: 1.5, fontWeight: "700" }]}
                    placeholder={t("referralByOptional") || "Referral Code (Optional)"}
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    maxLength={6}
                    value={reg.referralCode}
                    onChangeText={reg.handleReferralChange}
                  />
                  {reg.isReferralValidating && (
                    <ActivityIndicator size="small" color="#d4af37" />
                  )}
                  {reg.isReferralValidated && (
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  )}
                </View>

                {reg.referralMessage ? (
                  <Text
                    style={[
                      styles.referralHint,
                      reg.isReferralValidated ? { color: "#16a34a" } : { color: "#dc2626" },
                    ]}
                  >
                    {reg.referralMessage}
                  </Text>
                ) : null}

                {/* Continue Action */}
                <TouchableOpacity
                  style={[styles.fashionBtn, { backgroundColor: primaryColor, marginTop: 20 }]}
                  onPress={reg.submitForm}
                  disabled={reg.loading}
                  activeOpacity={0.88}
                >
                  {reg.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <>
                      <Text style={styles.fashionBtnText}>
                        {t("continueAction") || "Continue"}
                      </Text>
                      <Ionicons name="arrow-forward" size={17} color="#d4af37" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.centerLink} onPress={reg.goToLogin}>
                  <Text style={styles.centerLinkText}>
                    {t("alreadyHaveAccount") || "Already have an account? Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP */}
            {reg.step === "otp" && (
              <View>
                <Text style={styles.fashionStepTitle}>{t("enterOtpTitle") || "Verify Mobile"}</Text>
                <Text style={styles.fashionStepSub}>{t("otpSentTo") || "OTP sent to"}</Text>
                <Text style={styles.otpMobileTextV4}>+91 {reg.mobile}</Text>

                <SmoothPinInput
                  value={reg.otp}
                  onChangeText={reg.setOtp}
                  onComplete={(code) => reg.verifyOtp(code)}
                  containerStyle={styles.pillOtpRow}
                  boxStyle={styles.fashionPinBox}
                  boxFocusedStyle={styles.fashionPinBoxFocused}
                  boxFilledStyle={styles.fashionPinBoxFilled}
                  textStyle={styles.fashionPinText}
                  testID="otp-pin-input"
                />

                <View style={styles.timerBar}>
                  {reg.timer > 0 ? (
                    <Text style={styles.timerMuted}>
                      {t("resendOtpIn") || "Resend in"} {reg.timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={reg.resendOtp}
                      disabled={reg.loading}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="refresh" size={14} color="#0e1e38" />
                      <Text style={styles.resendDark}>{t("resendOtp") || "Resend OTP"}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.fashionBtn, { backgroundColor: primaryColor, marginTop: 22 }]}
                  onPress={() => reg.verifyOtp()}
                  disabled={reg.loading || reg.otp.length !== 4}
                  activeOpacity={0.88}
                >
                  {reg.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText} numberOfLines={1} adjustsFontSizeToFit>
                      {t("verifyOtp") || "Verify & Continue"}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.centerLink} onPress={() => reg.setStep("form")}>
                  <Text style={styles.centerLinkText}>{t("changeNumber") || "Change Details"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: SET MPIN */}
            {reg.step === "mpin" && (
              <View>
                <Text style={styles.fashionStepTitle} numberOfLines={1} adjustsFontSizeToFit>{t("setMpinTitle") || "Set 4-Digit MPIN"}</Text>
                <Text style={styles.fashionStepSub}>
                  {t("setMpinSubtitle") || "Create your secure 4-digit PIN"}
                </Text>

                <SmoothPinInput
                  value={reg.mpin}
                  onChangeText={reg.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  containerStyle={styles.pillOtpRow}
                  boxStyle={styles.fashionPinBox}
                  boxFocusedStyle={styles.fashionPinBoxFocused}
                  boxFilledStyle={styles.fashionPinBoxFilled}
                  textStyle={styles.fashionPinText}
                  testID="set-mpin-pin-input"
                />

                <Text style={[styles.fashionStepSub, { marginTop: 14, textAlign: "center" }]}>
                  {t("confirmMpinTitle") || "Confirm MPIN"}
                </Text>

                <SmoothPinInput
                  value={reg.confirmMpin}
                  onChangeText={reg.setConfirmMpin}
                  secure={true}
                  allowToggleSecure={true}
                  autoFocus={false}
                  containerStyle={styles.pillOtpRow}
                  boxStyle={styles.fashionPinBox}
                  boxFocusedStyle={styles.fashionPinBoxFocused}
                  boxFilledStyle={styles.fashionPinBoxFilled}
                  textStyle={styles.fashionPinText}
                  testID="confirm-mpin-pin-input"
                />

                <TouchableOpacity
                  style={[styles.fashionBtn, { backgroundColor: primaryColor, marginTop: 22 }]}
                  onPress={reg.submitMpin}
                  disabled={reg.loading || reg.mpin.length !== 4 || reg.confirmMpin.length !== 4}
                  activeOpacity={0.88}
                >
                  {reg.loading ? (
                    <ActivityIndicator color="#d4af37" size="small" />
                  ) : (
                    <Text style={styles.fashionBtnText} numberOfLines={1} adjustsFontSizeToFit>
                      {t("completeRegistration") || "Complete Registration"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

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

      {/* Branch Modal */}
      <Modal
        visible={showBranchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fashionBranchCard}>
            <View style={styles.branchHeader}>
              <Text style={styles.branchHeaderTitle}>
                {t("selectBranch") || "Select Home Branch"}
              </Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: screenHeight * 0.45 }}>
              {reg.branches.map((b) => {
                const isSelected = Number(b.id) === Number(reg.selectedBranchId);
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => {
                      reg.setSelectedBranchId(Number(b.id));
                      setShowBranchModal(false);
                    }}
                    style={[
                      styles.fashionBranchRow,
                      isSelected && { backgroundColor: "rgba(14, 30, 56, 0.06)", borderColor: primaryColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fashionBranchRowText,
                        isSelected && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      {b.branch_name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={primaryColor} />
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pillLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  pillBrandName: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  minimalLangBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  minimalLangText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 5,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexGrow: 1,
  },
  editorialHeader: {
    marginVertical: 14,
  },
  editorialEyebrow: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 4,
  },
  editorialTitle: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  editorialSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 4,
  },
  fashionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  errorPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  errorPillText: {
    flex: 1,
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    marginHorizontal: 8,
  },
  pillInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginTop: 12,
  },
  flagCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  verticalBar: {
    width: 1,
    height: 22,
    backgroundColor: "#cbd5e1",
    marginHorizontal: 10,
  },
  pillInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  pillBranchText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
  referralHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
  fashionBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  fashionBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  centerLink: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  centerLinkText: {
    color: "#0e1e38",
    fontSize: 13,
    fontWeight: "700",
  },
  fashionStepTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
  },
  fashionStepSub: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  pillOtpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  fashionPinBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  fashionPinBoxFocused: {
    borderColor: "#0e1e38",
    backgroundColor: "#ffffff",
    borderWidth: 2,
  },
  fashionPinBoxFilled: {
    borderColor: "#d4af37",
    backgroundColor: "#fffdf0",
  },
  fashionPinText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0f172a",
    textAlign: "center",
    width: "100%",
  },
  timerBar: {
    alignItems: "center",
    marginVertical: 4,
  },
  timerMuted: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "500",
  },
  resendDark: {
    color: "#0e1e38",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  fashionBranchCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: screenHeight * 0.65,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingBottom: 14,
    marginBottom: 12,
  },
  branchHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  fashionBranchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 8,
  },
  fashionBranchRowText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  otpMobileTextV4: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 4,
    marginBottom: 8,
  },
  poweredByContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  poweredByText: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  poweredByLink: {
    color: "#d4af37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

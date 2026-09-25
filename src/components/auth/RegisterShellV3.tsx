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

interface RegisterShellV3Props {
  initialMobile?: string;
  initialReferral?: string;
}

export default function RegisterShellV3({
  initialMobile = "",
  initialReferral = "",
}: RegisterShellV3Props) {
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

  const selectedBranchName = (() => {
    if (reg.branches.length === 0) return t("loading") || "Loading branches...";
    const found = reg.branches.find((b) => Number(b.id) === Number(reg.selectedBranchId));
    return found ? found.branch_name : t("selectBranch") || "Select Home Branch *";
  })();

  return (
    <View style={styles.container}>
      {/* Background orbs */}
      <View style={[styles.bokehOrb, { top: -60, left: -40, width: 280, height: 280, backgroundColor: "rgba(212, 175, 55, 0.12)" }]} />
      <View style={[styles.bokehOrb, { top: "40%", right: -80, width: 300, height: 300, backgroundColor: "rgba(30, 58, 138, 0.25)" }]} />

      {/* Top Header */}
      <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={reg.goToLogin} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#e2e8f0" />
        </TouchableOpacity>

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

      <KeyboardAvoidingView behavior={undefined} style={{ flex: 1 }}>
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
          </View>

          {/* Frosted Glass Card */}
          <View style={styles.glassCard}>
            {reg.error ? (
              <View style={styles.errorGlassBanner}>
                <Ionicons name="alert-circle" size={17} color="#f87171" />
                <Text style={styles.errorGlassText}>{reg.error}</Text>
                <TouchableOpacity onPress={reg.clearError}>
                  <Ionicons name="close" size={16} color="#f87171" />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* STEP 1: REGISTRATION FORM */}
            {reg.step === "form" && (
              <View>
                <Text style={styles.glassTitle}>{t("createAccount") || "Create Account"}</Text>
                <Text style={styles.glassSubtitle}>
                  {t("registerSubtitle") || "Join our privileged savings circle"}
                </Text>

                {/* Mobile Input */}
                <View style={styles.glassInputWrapper}>
                  <View style={styles.flagGroup}>
                    <Text style={{ fontSize: 16 }}>🇮🇳</Text>
                    <Text style={styles.flagCode}>+91</Text>
                  </View>
                  <View style={styles.divider} />
                  <TextInput
                    style={styles.glassInput}
                    placeholder={t("enterMobileNumber")}
                    placeholderTextColor="#64748b"
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
                <View style={[styles.glassInputWrapper, { marginTop: 12 }]}>
                  <Feather name="user" size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.glassInput}
                    placeholder={t("fullNamePlaceholder") || "Full Name *"}
                    placeholderTextColor="#64748b"
                    value={reg.name}
                    onChangeText={(val) => {
                      reg.clearError();
                      reg.setName(val);
                    }}
                  />
                </View>

                {/* Email */}
                <View style={[styles.glassInputWrapper, { marginTop: 12 }]}>
                  <Feather name="mail" size={17} color="#94a3b8" style={{ marginRight: 10 }} />
                  <TextInput
                    style={styles.glassInput}
                    placeholder={t("emailPlaceholder") || "Email Address *"}
                    placeholderTextColor="#64748b"
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
                    styles.glassInputWrapper,
                    { marginTop: 12 },
                    reg.isBranchDisabled && { opacity: 0.6 },
                  ]}
                  onPress={() => !reg.isBranchDisabled && setShowBranchModal(true)}
                  activeOpacity={0.7}
                  disabled={reg.isBranchDisabled}
                >
                  <Feather name="map-pin" size={17} color="#d4af37" style={{ marginRight: 10 }} />
                  <Text
                    style={[
                      styles.glassBranchText,
                      !reg.selectedBranchId && { color: "#64748b" },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedBranchName}
                  </Text>
                  {!reg.isBranchDisabled && (
                    <Ionicons name="chevron-down" size={17} color="#94a3b8" />
                  )}
                </TouchableOpacity>

                {/* Referral Code (Optional) */}
                <View style={[styles.glassInputWrapper, { marginTop: 12 }]}>
                  <Feather name="gift" size={17} color="#d4af37" style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.glassInput, { letterSpacing: 1.5, fontWeight: "700" }]}
                    placeholder={t("referralByOptional") || "Referral Code (Optional)"}
                    placeholderTextColor="#64748b"
                    autoCapitalize="characters"
                    maxLength={6}
                    value={reg.referralCode}
                    onChangeText={reg.handleReferralChange}
                  />
                  {reg.isReferralValidating && (
                    <ActivityIndicator size="small" color="#d4af37" />
                  )}
                  {reg.isReferralValidated && (
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                  )}
                </View>

                {reg.referralMessage ? (
                  <Text
                    style={[
                      styles.referralHint,
                      reg.isReferralValidated ? { color: "#22c55e" } : { color: "#f87171" },
                    ]}
                  >
                    {reg.referralMessage}
                  </Text>
                ) : null}

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.goldButton}
                  onPress={reg.submitForm}
                  disabled={reg.loading}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f3e5ab", "#aa771c"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.goldGradInner}
                  >
                    {reg.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <>
                        <Text style={styles.goldButtonText}>
                          {t("continueAction") || "Continue"}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#0e1e38" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomLink} onPress={reg.goToLogin}>
                  <Text style={styles.bottomLinkText}>
                    {t("alreadyHaveAccount") || "Already have an account? Sign In"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {reg.step === "otp" && (
              <View>
                <Text style={styles.glassTitle}>{t("enterOtpTitle") || "Verify Mobile"}</Text>
                <Text style={styles.glassSubtitle}>{t("otpSentTo") || "OTP sent to"}</Text>
                <Text style={styles.otpMobileTextV3}>+91 {reg.mobile}</Text>

                <SmoothPinInput
                  value={reg.otp}
                  onChangeText={reg.setOtp}
                  onComplete={(code) => reg.verifyOtp(code)}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassPinBox}
                  boxFocusedStyle={styles.glassPinBoxFocused}
                  boxFilledStyle={styles.glassPinBoxFilled}
                  textStyle={styles.glassPinText}
                  testID="otp-pin-input"
                />

                <View style={styles.timerCenter}>
                  {reg.timer > 0 ? (
                    <Text style={styles.timerInfo}>
                      {t("resendOtpIn") || "Resend in"} {reg.timer}s
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={reg.resendOtp}
                      disabled={reg.loading}
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Ionicons name="refresh" size={14} color="#d4af37" />
                      <Text style={styles.resendGold}>{t("resendOtp") || "Resend OTP"}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.goldButton, { marginTop: 22 }]}
                  onPress={() => reg.verifyOtp()}
                  disabled={reg.loading || reg.otp.length !== 4}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f3e5ab", "#aa771c"]}
                    style={styles.goldGradInner}
                  >
                    {reg.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText} numberOfLines={1} adjustsFontSizeToFit>
                        {t("verifyOtp") || "Verify & Continue"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bottomLink} onPress={() => reg.setStep("form")}>
                  <Text style={styles.bottomLinkText}>{t("changeNumber") || "Change Details"}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: SET MPIN */}
            {reg.step === "mpin" && (
              <View>
                <Text style={styles.glassTitle} numberOfLines={1} adjustsFontSizeToFit>{t("setMpinTitle") || "Set 4-Digit MPIN"}</Text>
                <Text style={styles.glassSubtitle}>
                  {t("setMpinSubtitle") || "Create an MPIN for fast and secure access"}
                </Text>

                <SmoothPinInput
                  value={reg.mpin}
                  onChangeText={reg.setMpin}
                  secure={true}
                  allowToggleSecure={true}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassPinBox}
                  boxFocusedStyle={styles.glassPinBoxFocused}
                  boxFilledStyle={styles.glassPinBoxFilled}
                  textStyle={styles.glassPinText}
                  testID="set-mpin-pin-input"
                />

                <Text style={[styles.glassSubtitle, { marginTop: 14, textAlign: "center" }]}>
                  {t("confirmMpinTitle") || "Confirm MPIN"}
                </Text>

                <SmoothPinInput
                  value={reg.confirmMpin}
                  onChangeText={reg.setConfirmMpin}
                  secure={true}
                  allowToggleSecure={true}
                  autoFocus={false}
                  containerStyle={styles.otpBoxesRow}
                  boxStyle={styles.glassPinBox}
                  boxFocusedStyle={styles.glassPinBoxFocused}
                  boxFilledStyle={styles.glassPinBoxFilled}
                  textStyle={styles.glassPinText}
                  testID="confirm-mpin-pin-input"
                />

                <TouchableOpacity
                  style={[styles.goldButton, { marginTop: 22 }]}
                  onPress={reg.submitMpin}
                  disabled={reg.loading || reg.mpin.length !== 4 || reg.confirmMpin.length !== 4}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={["#d4af37", "#f3e5ab", "#aa771c"]}
                    style={styles.goldGradInner}
                  >
                    {reg.loading ? (
                      <ActivityIndicator color="#0e1e38" size="small" />
                    ) : (
                      <Text style={styles.goldButtonText}>
                        {t("completeRegistration") || "Complete Registration"}
                      </Text>
                    )}
                  </LinearGradient>
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
        animationType="fade"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.glassBranchCard}>
            <View style={styles.branchHeader}>
              <Text style={styles.branchHeaderTitle}>
                {t("selectBranch") || "Select Home Branch"}
              </Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#e2e8f0" />
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
                      styles.glassBranchRow,
                      isSelected && { backgroundColor: "rgba(212, 175, 55, 0.15)", borderColor: "#d4af37" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.glassBranchRowText,
                        isSelected && { color: "#d4af37", fontWeight: "700" },
                      ]}
                    >
                      {b.branch_name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color="#d4af37" />
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
    backgroundColor: "#081121",
  },
  bokehOrb: {
    position: "absolute",
    borderRadius: 200,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
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
    paddingTop: 6,
    flexGrow: 1,
  },
  brandHero: {
    alignItems: "center",
    marginVertical: 12,
  },
  goldGlowRing: {
    width: 95,
    height: 95,
    borderRadius: 48,
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
    width: 75,
    height: 75,
  },
  brandNameText: {
    fontSize: 19,
    fontWeight: "800",
    color: "#f8fafc",
    marginTop: 8,
    letterSpacing: 0.5,
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    padding: 22,
    marginTop: 6,
  },
  errorGlassBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 9,
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
  glassTitle: {
    fontSize: 21,
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
  glassInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginTop: 14,
  },
  flagGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  flagCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e2e8f0",
    marginLeft: 4,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: 12,
  },
  glassInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  glassBranchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  referralHint: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    marginLeft: 4,
  },
  goldButton: {
    height: 50,
    borderRadius: 14,
    marginTop: 18,
    overflow: "hidden",
  },
  goldGradInner: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  goldButtonText: {
    color: "#0e1e38",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  bottomLink: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 4,
  },
  bottomLinkText: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "700",
  },
  otpBoxesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  glassPinBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  glassPinBoxFocused: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  glassPinBoxFilled: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  glassPinText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    width: "100%",
  },
  timerCenter: {
    alignItems: "center",
    marginVertical: 4,
  },
  timerInfo: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },
  resendGold: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  glassBranchCard: {
    width: "100%",
    backgroundColor: "#0d1b2a",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    padding: 20,
  },
  branchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingBottom: 12,
    marginBottom: 12,
  },
  branchHeaderTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
  },
  glassBranchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 8,
  },
  glassBranchRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#cbd5e1",
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

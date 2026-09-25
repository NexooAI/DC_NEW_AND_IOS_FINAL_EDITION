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
  Modal,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { useRegisterLogic } from "./useRegisterLogic";
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

interface RegisterShellV2Props {
  initialMobile?: string;
  initialReferral?: string;
}

export default function RegisterShellV2({
  initialMobile = "",
  initialReferral = "",
}: RegisterShellV2Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const reg = useRegisterLogic({ initialMobile, initialReferral });

  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;

  // Smooth slide-up when keyboard opens (iOS only; Android handles resize natively)
  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const showSub = Keyboard.addListener("keyboardWillShow", (e) => {
      Animated.timing(sheetTranslateY, {
        toValue: -90,
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
  }, [reg.step]);

  const brandLogoSource =
    typeof themeConfig?.icon === "string" && themeConfig.icon.startsWith("http")
      ? { uri: themeConfig.icon }
      : resolveImageSource(themeConfig?.icon, DEFAULT_BRAND_LOGO);
  const brandName = theme.constants?.customerName || themeConfig?.customerName || "Sri Thanga Thamarai";
  const primaryColor = themeConfig?.primaryColor || theme.colors.primary || "#0e1e38";
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
      {/* Top Language Switcher */}
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
          Platform.OS === "ios" ? { transform: [{ translateY: sheetTranslateY }] } : null,
        ]}
      >
        {/* Top Hero Section: Luxury Header Positioned Above Bottom Sheet */}
        <View style={[styles.topSection, { backgroundColor: primaryColor, paddingTop: insets.top + 6 }]}>
          <LinearGradient
            colors={["rgba(14, 30, 56, 0.95)", "rgba(10, 20, 38, 0.98)"]}
            style={StyleSheet.absoluteFillObject}
          />
          <Image
            source={require("../../../assets/images/jewelry_pattern.png")}
            style={[StyleSheet.absoluteFillObject, styles.patternOverlay]}
            resizeMode="repeat"
          />

          <View style={styles.brandContainer}>
            <View style={styles.logoHaloWrapper}>
              <View style={styles.ambientGlow} />
              <View style={styles.logoRing}>
                <Image source={brandLogoSource} style={styles.brandLogo} resizeMode="contain" />
              </View>
            </View>
            <Text style={styles.brandTitle} numberOfLines={1}>{brandName}</Text>
            <View style={styles.goldDivider}>
              <View style={styles.dividerLine} />
              <Ionicons name="sparkles" size={12} color="#d4af37" style={{ marginHorizontal: 6 }} />
              <View style={styles.dividerLine} />
            </View>
          </View>
        </View>

        {/* Bottom Sheet (Hugs Content Height) */}
        <View
          style={[
            styles.bottomSheet,
            {
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
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
              {reg.error ? (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorBannerText}>{reg.error}</Text>
                </View>
              ) : null}

              {/* STEP 1: FORM */}
              {reg.step === "form" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("createAccount") || "Create Account"}</Text>
                  <Text style={styles.subtitleText}>
                    {t("registerSubtitle") || "Join us to invest and save in 22K BIS hallmarked gold"}
                  </Text>

                  {/* Full Name */}
                  <View style={styles.inputContainer}>
                    <Feather name="user" size={18} color="#6b7280" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t("fullNamePlaceholder") || "Full Name *"}
                      placeholderTextColor="#9ca3af"
                      value={reg.name}
                      onChangeText={reg.setName}
                      autoCapitalize="words"
                      editable={!reg.loading}
                    />
                  </View>

                  {/* Mobile Number */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.vSeparator} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t("mobilePlaceholder") || "10-digit mobile number *"}
                      placeholderTextColor="#9ca3af"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={reg.mobile}
                      onChangeText={reg.setMobile}
                      editable={!reg.loading}
                    />
                  </View>

                  {/* Email */}
                  <View style={styles.inputContainer}>
                    <Feather name="mail" size={18} color="#6b7280" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t("emailPlaceholder") || "Email Address (Optional)"}
                      placeholderTextColor="#9ca3af"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={reg.email}
                      onChangeText={reg.setEmail}
                      editable={!reg.loading}
                    />
                  </View>

                  {/* Branch Selector */}
                  <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowBranchModal(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="map-pin" size={18} color="#6b7280" style={styles.fieldIcon} />
                    <Text
                      style={[
                        styles.branchText,
                        !reg.selectedBranchId && { color: "#9ca3af" },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedBranchName}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#6b7280" />
                  </TouchableOpacity>

                  {/* Referral Code */}
                  <View style={styles.inputContainer}>
                    <Feather name="gift" size={18} color="#6b7280" style={styles.fieldIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t("referralCodeOptional") || "Referral Code (Optional)"}
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="characters"
                      value={reg.referralCode}
                      onChangeText={reg.handleReferralChange}
                      editable={!reg.loading}
                    />
                    {reg.isReferralValidating && (
                      <ActivityIndicator size="small" color="#d4af37" />
                    )}
                    {reg.isReferralValidated && (
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
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

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor, marginTop: 20 }]}
                    onPress={reg.submitForm}
                    disabled={reg.loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientButton}
                    >
                      {reg.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <>
                          <Text style={styles.primaryButtonText}>
                            {t("continueAction") || "Continue"}
                          </Text>
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

                  {/* Switch to Login */}
                  <TouchableOpacity
                    style={styles.switchAuthLink}
                    onPress={reg.goToLogin}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.switchAuthText}>
                      {language === "ta" ? "ஏற்கனவே கணக்கு உள்ளதா? " : "Already have an account? "}
                      <Text style={styles.switchAuthAction}>
                        {language === "ta" ? "உள்நுழைக" : "Sign In"}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {reg.step === "otp" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("enterOtpTitle") || "Verify Mobile"}</Text>
                  <Text style={styles.subtitleText}>{t("otpSentTo") || "OTP sent to"}</Text>
                  <Text style={styles.mobileHighlightText}>+91 {reg.mobile}</Text>

                  <SmoothPinInput
                    value={reg.otp}
                    onChangeText={reg.setOtp}
                    length={4}
                    secure={false}
                    editable={!reg.loading}
                    autoFocus={true}
                    onComplete={(code: string) => reg.verifyOtp(code)}
                  />

                  <View style={styles.timerRow}>
                    {reg.timer > 0 ? (
                      <Text style={styles.timerText}>
                        {t("resendOtpIn") || "Resend in"} {reg.timer}s
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={reg.resendOtp}
                        disabled={reg.loading}
                        style={styles.resendBtn}
                      >
                        <Ionicons name="refresh" size={15} color="#d4af37" />
                        <Text style={styles.resendText}>{t("resendOtp") || "Resend OTP"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor, marginTop: 22 }]}
                    onPress={() => reg.verifyOtp()}
                    disabled={reg.loading || reg.otp.length !== 4}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {reg.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {t("verifyOtp") || "Verify & Continue"}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchAuthLink}
                    onPress={() => reg.setStep("form")}
                  >
                    <Text style={styles.switchAuthText}>
                      {t("changeNumber") || "Change Details"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 3: SET MPIN */}
              {reg.step === "mpin" && (
                <View style={styles.stepContainer}>
                  <Text style={styles.titleText}>{t("setMpinTitle") || "Set 4-Digit MPIN"}</Text>
                  <Text style={styles.subtitleText}>
                    {t("setMpinSubtitle") || "Create an MPIN for fast and secure access"}
                  </Text>

                  <SmoothPinInput
                    value={reg.mpin}
                    onChangeText={reg.setMpin}
                    length={4}
                    secure={true}
                    allowToggleSecure={true}
                    editable={!reg.loading}
                    autoFocus={true}
                  />

                  <Text style={[styles.subtitleText, { marginTop: 18, marginBottom: 4 }]}>
                    {t("confirmMpinTitle") || "Confirm MPIN"}
                  </Text>

                  <SmoothPinInput
                    value={reg.confirmMpin}
                    onChangeText={reg.setConfirmMpin}
                    length={4}
                    secure={true}
                    allowToggleSecure={true}
                    editable={!reg.loading}
                    autoFocus={false}
                    onComplete={(_code: string) => {
                      if (reg.mpin.length === 4) {
                        reg.submitMpin();
                      }
                    }}
                  />

                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: primaryColor, marginTop: 24 }]}
                    onPress={reg.submitMpin}
                    disabled={
                      reg.loading || reg.mpin.length !== 4 || reg.confirmMpin.length !== 4
                    }
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={[primaryColor, "#1a365d"]}
                      style={styles.gradientButton}
                    >
                      {reg.loading ? (
                        <ActivityIndicator color="#d4af37" size="small" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {t("completeRegistration") || "Complete Registration"}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* Powered by Agnisofterp Footer */}
              <TouchableOpacity
                style={styles.poweredByContainer}
                activeOpacity={0.7}
                onPress={() => {
                  if (providerUrl) {
                    Linking.openURL(providerUrl).catch(() => {});
                  }
                }}
              >
                <Text style={styles.poweredByText}>
                  {t("poweredBy") || "Powered by"}{" "}
                  <Text style={styles.poweredByName}>{providerName}</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>

      {/* Branch Selection Modal */}
      <Modal
        visible={showBranchModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBranchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.branchModalCard}>
            <View style={styles.branchModalHeader}>
              <Text style={styles.branchModalTitle}>
                {t("selectBranch") || "Select Home Branch"}
              </Text>
              <TouchableOpacity onPress={() => setShowBranchModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={24} color="#1f2937" />
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
                      styles.branchItemRow,
                      isSelected && { backgroundColor: "rgba(14, 30, 56, 0.08)", borderColor: primaryColor },
                    ]}
                  >
                    <Text
                      style={[
                        styles.branchItemText,
                        isSelected && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      {b.branch_name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={primaryColor} />
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
    paddingBottom: 16,
    minHeight: 140,
  },
  patternOverlay: {
    opacity: 0.05,
    tintColor: "#ffffff",
  },
  brandContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
    paddingHorizontal: 20,
  },
  logoHaloWrapper: {
    width: 76,
    height: 76,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(212, 175, 55, 0.22)",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  logoRing: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(14, 30, 56, 0.85)",
    borderWidth: 1.8,
    borderColor: "rgba(212, 175, 55, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  brandLogo: {
    width: 54,
    height: 54,
    aspectRatio: 1,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.4,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  goldDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    width: 90,
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
    maxHeight: "85%",
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  sheetContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 16,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  stepContainer: {
    width: "100%",
  },
  titleText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 4,
    fontWeight: "500",
  },
  mobileHighlightText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0e1e38",
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 8,
  },
  countryCode: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 4,
  },
  vSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "#d1d5db",
    marginHorizontal: 10,
  },
  fieldIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  branchText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  referralHint: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    marginLeft: 4,
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    marginTop: 14,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  switchAuthLink: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 4,
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
  timerRow: {
    alignItems: "center",
    marginVertical: 4,
  },
  timerText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
  },
  resendText: {
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
  branchModalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: screenHeight * 0.65,
  },
  branchModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 14,
    marginBottom: 12,
  },
  branchModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  branchItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 8,
  },
  branchItemText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  poweredByContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
    paddingVertical: 4,
  },
  poweredByText: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  poweredByName: {
    color: "#d4af37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});

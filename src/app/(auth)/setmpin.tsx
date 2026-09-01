import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Image,
  Animated,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  Keyboard,
  Pressable,
  StatusBar,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { useBiometrics } from "@/hooks/useBiometrics";
const { hp } = responsiveUtils;
import Svg, { Path } from 'react-native-svg';

import { logger } from "@/utils/logger";
const { width } = Dimensions.get("window");
const salt = "someRandomSaltValue";

const hashMPIN = async (mpin: string): Promise<void> => {
  try {
    const hashedMPIN = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      salt + mpin
    );
    await SecureStore.setItemAsync("user_mpin", hashedMPIN);
  } catch (error) {
    logger.error("Error hashing MPIN:", error);
    throw error;
  }
};

interface PinInputProps {
  value: string;
  isActive: boolean;
  onPress: () => void;
  index: number;
  secureTextEntry: boolean;
  onChange: (val: string, idx: number) => void;
  inputRef: React.RefObject<TextInput | null>;
}

const PinInput: React.FC<PinInputProps> = ({
  value,
  isActive,
  onPress,
  index,
  secureTextEntry,
  onChange,
  inputRef,
}) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pinBox}>
      <TextInput
        ref={inputRef}
        style={[
          styles.pinBoxInner,
          isActive && styles.pinBoxActive,
          { textAlign: "center", fontSize: 24, color: theme.colors.primary },
        ]}
        keyboardType="number-pad"
        maxLength={1}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={(text) =>
          onChange(text.replace(/[^0-9]/g, "").slice(-1), index)
        }
        onFocus={onPress}
      />
    </TouchableOpacity>
  );
};

export default function SetMpinPage() {
  const { t } = useTranslation();
  const { isVisible } = useAppVisibility();
  const { mobile, name, email, referral_code, branch_id } = useLocalSearchParams();
  const router = useRouter();
  const {
    isSupported,
    isEnrolled,
    isEnabled,
    enableBiometrics
  } = useBiometrics();
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [confirmMpin, setConfirmMpin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [activeInput, setActiveInput] = useState<"mpin" | "confirm">("mpin");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showPin, setShowPin] = useState(false);

  const mpinRefs = Array.from({ length: 4 }, () =>
    useRef<TextInput | null>(null)
  );
  const confirmRefs = Array.from({ length: 4 }, () =>
    useRef<TextInput | null>(null)
  );

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  const mpinValue = mpin.join("");
  const confirmValue = confirmMpin.join("");
  const mpinValid = /^[0-9]{4}$/.test(mpinValue);
  const confirmValid = /^[0-9]{4}$/.test(confirmValue);
  const matchError = mpinValid && confirmValid && mpinValue !== confirmValue;

  const handlePinChange = (
    val: string,
    idx: number,
    type: "mpin" | "confirm"
  ) => {
    if (type === "mpin") {
      const newPins = [...mpin];
      newPins[idx] = val;
      setMpin(newPins);
      if (val && idx < 3) mpinRefs[idx + 1].current?.focus();
      if (!val && idx > 0) mpinRefs[idx - 1].current?.focus();
    } else {
      const newPins = [...confirmMpin];
      newPins[idx] = val;
      setConfirmMpin(newPins);
      if (val && idx < 3) confirmRefs[idx + 1].current?.focus();
      if (!val && idx > 0) confirmRefs[idx - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    if (!mpinValid || !confirmValid) {
      showErrorAlert(t("mpinValidationError"));
      return;
    }
    if (mpinValue !== confirmValue) {
      showErrorAlert(t("mpinMismatchError"));
      return;
    }
    setLoading(true);
    try {
      await hashMPIN(mpinValue);
      const response = await api.post("/register/complete", {
        name,
        email,
        mobile_number: mobile,
        mpin: mpinValue,
        password: mpinValue,
        referral_code,
        branch_id: branch_id ? Number(branch_id) : null,
      });
      const data = response.data;
      logger.log("🔍 Set MPIN response:", data);

      if (data.success) {
        try {
          // Store all tokens securely like in login flow
          await SecureStore.setItemAsync("authToken", data.token);
          await SecureStore.setItemAsync("accessToken", data.accessToken);
          await SecureStore.setItemAsync("token", data.token);
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);

          // Store user data in AsyncStorage like in login flow
          await AsyncStorage.setItem("userData", JSON.stringify(data.user));

          // Login to global store like in login flow
          logger.log("🔍 Setting user data in global store (Set MPIN):", {
            id: data.user.user_id,
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile_number,
            referralCode: data.user.referralCode,
            profile_photo: data.user.profile_photo,
            mpinStatus: data.user.mpinStatus,
            usertype: data.user.userType,
          });
          useGlobalStore.getState().login(data.token, {
            id: data.user.user_id,
            name: data.user.name,
            email: data.user.email,
            mobile: data.user.mobile_number,
            referralCode: data.user.referralCode,
            profile_photo: data.user.profile_photo,
            mpinStatus: data.user.mpinStatus,
            usertype: data.user.userType,
          });

          // Store registration timestamp to bypass MPIN verification
          await SecureStore.setItemAsync(
            "registrationTimestamp",
            Date.now().toString()
          );

          // Clear clipboard of referral code on successful registration to prevent reuse
          try {
            const Clipboard = require("expo-clipboard");
            await Clipboard.setStringAsync("");
            logger.log("🧹 Clipboard cleared successfully after registration");
          } catch (clipError) {
            logger.error("Failed to clear clipboard:", clipError);
          }

          // Navigate directly to home page after successful registration
          logger.log("🔍 Set MPIN successful, prompting biometric enrollment if supported");
          
          const handlePostRegistrationRedirect = () => {
            router.replace("/(app)/(tabs)/home");
          };

          if (isSupported && isEnrolled) {
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
                    handlePostRegistrationRedirect();
                  }
                },
                {
                  text: yesText.startsWith("[missing") ? "Yes" : yesText,
                  onPress: async () => {
                    const success = await enableBiometrics(mpinValue);
                    if (success) {
                      Alert.alert(t("success"), t("biometricsEnabled") || "Biometrics enabled successfully", [
                        { text: "OK", onPress: () => handlePostRegistrationRedirect() }
                      ]);
                    } else {
                      try {
                        await AsyncStorage.setItem('hasDeclinedBiometrics', 'true');
                      } catch (err) {
                        logger.error("Error setting hasDeclinedBiometrics after failure:", err);
                      }
                      handlePostRegistrationRedirect();
                    }
                  }
                }
              ],
              { cancelable: false }
            );
          } else {
            handlePostRegistrationRedirect();
          }
        } catch (storageError) {
          logger.error("Error storing authentication data:", storageError);
          showErrorAlert("Failed to store authentication data");
        }
      } else {
        showErrorAlert(data.message || t("registrationFailed"));
      }
    } catch (error: any) {
      showErrorAlert(error.response?.data?.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.gradient}>
        {showError && (
          <View style={styles.errorAlert}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color={COLORS.white} />
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowError(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressable onPress={Keyboard.dismiss} style={{ flex: 1, width: "100%" }}>
              {/* Header Back Button Area */}
              <View
                style={{
                  height: Platform.OS === 'ios' ? hp(22) : hp(20),
                  paddingTop: Platform.OS === 'ios' ? 70 : 50,
                  paddingHorizontal: 20,
                  width: "100%",
                  zIndex: 1,
                  backgroundColor: theme.colors.primary,
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
                        source={require("../../../assets/images/intro_1.png")}
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
                        source={require("../../../assets/images/intro_2.png")}
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
                        source={require("../../../assets/images/intro_3.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
                  {/* Back arrow in small gold circle */}
                  <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.colors.secondary || '#F8CF2C',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom White Card */}
              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 24,
                  paddingTop: 30,
                  paddingBottom: Platform.OS === "ios" ? 80 : 100,
                  flex: 1,
                  zIndex: 1,
                  position: 'relative',
                }}
              >
                {/* Custom wave curve at the top */}
                <View style={{ position: 'absolute', top: -39, left: 0, right: 0, height: 40, zIndex: 10, backgroundColor: 'transparent' }}>
                  <Svg height="40" width={width} viewBox={`0 0 ${width} 40`} style={{ position: 'absolute', top: 0, left: 0 }}>
                    <Path
                      d={`M0,40 C${width * 0.3},40 ${width * 0.7},0 ${width},0 L${width},40 L0,40 Z`}
                      fill="#FFFFFF"
                    />
                  </Svg>
                </View>

                {/* Content */}
                <View style={{ width: '100%' }}>
                  {/* Title and Subtitle inside the white card */}
                  <View style={{ marginBottom: 20 }}>
                    <Text style={{ color: theme.colors.primary, fontSize: 22, fontWeight: 'bold', marginBottom: 6 }}>
                      {t("setMpinTitle") || "Set MPIN"}
                    </Text>
                    <Text style={{ color: '#666666', fontSize: 14 }}>
                      {t("setMpinSubtitle") || "Set your 4-digit MPIN for quick login"}
                    </Text>
                  </View>

                  {/* MPIN Input Boxes */}
                  <Text style={styles.label}>{t("createMpinLabel")}</Text>
                  <View style={styles.pinContainer}>
                    {mpin.map((digit, index) => (
                      <PinInput
                        key={index}
                        value={digit}
                        isActive={activeInput === "mpin" && activeIndex === index}
                        onPress={() => {
                          setActiveInput("mpin");
                          setActiveIndex(index);
                          mpinRefs[index].current?.focus();
                        }}
                        index={index}
                        secureTextEntry={!showPin}
                        onChange={(val, idx) => handlePinChange(val, idx, "mpin")}
                        inputRef={mpinRefs[index]}
                      />
                    ))}
                  </View>
                  <Text style={styles.label}>{t("confirmMpinLabel")}</Text>
                  <View style={styles.pinContainer}>
                    {confirmMpin.map((digit, index) => (
                      <PinInput
                        key={index}
                        value={digit}
                        isActive={
                          activeInput === "confirm" && activeIndex === index
                        }
                        onPress={() => {
                          setActiveInput("confirm");
                          setActiveIndex(index);
                          confirmRefs[index].current?.focus();
                        }}
                        index={index}
                        secureTextEntry={!showPin}
                        onChange={(val, idx) =>
                          handlePinChange(val, idx, "confirm")
                        }
                        inputRef={confirmRefs[index]}
                      />
                    ))}
                  </View>
                  {/* Show/Hide Toggle */}
                  <TouchableOpacity
                    style={styles.eyeToggle}
                    onPress={() => setShowPin(!showPin)}
                  >
                    <Ionicons
                      name={showPin ? "eye-off" : "eye"}
                      size={24}
                      color={theme.colors.secondary}
                    />
                    <Text style={styles.eyeText}>
                      {showPin ? t("hideMpinLabel") : t("showMpinLabel")}
                    </Text>
                  </TouchableOpacity>
                  {matchError && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={20} color={COLORS.red} />
                      <Text style={styles.errorText}>{t("mpinMismatchError")}</Text>
                    </View>
                  )}
                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      (loading || !mpinValid || !confirmValid || matchError) &&
                        styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={loading || !mpinValid || !confirmValid || matchError}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.primary]}
                      style={styles.gradientButton}
                    >
                      <View style={styles.buttonContent}>
                        {loading ? (
                          <>
                            <Ionicons
                              name="hourglass"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                              {t("processing")}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#FFFFFF"
                            />
                            <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                              {t("setMpinButton")}
                            </Text>
                          </>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                  {/* Back Button */}
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.backButtonText}>{t("backButton")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
    paddingVertical: 20,
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pageTitle: {
    color: theme.colors.textLight,
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.textLight,
    fontSize: 15,
    marginBottom: 25,
    textAlign: "center",
    opacity: 0.8,
  },
  pinContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  pinBox: {
    width: 60,
    height: 60,
  },
  pinBoxInner: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    color: "#000000",
  },
  pinBoxActive: {
    borderColor: "#ffc90c",
    backgroundColor: "#ffffff",
  },
  pinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffc90c",
  },
  pinPlaceholder: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 16,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
  },
  eyeToggle: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    alignSelf: "center",
  },
  eyeText: {
    color: theme.colors.secondary,
    marginLeft: 10,
    fontSize: 16,
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 15,
    marginBottom: 15,
  },
  gradientButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitButtonText: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    marginLeft: 5,
  },
  errorAlert: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255, 68, 68, 0.95)",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  errorMessage: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  label: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    marginLeft: 10,
  },
});

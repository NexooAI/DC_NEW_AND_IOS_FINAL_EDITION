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
          { textAlign: "center", fontSize: 24, color: theme.colors.textLight },
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
  const { mobile, name, email, referral_code } = useLocalSearchParams();
  const router = useRouter();
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

          // Navigate directly to home page after successful registration
          logger.log("🔍 Set MPIN successful, navigating to home");
          router.replace("/(app)/(tabs)/home");
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
              style={[
                styles.backgroundImage,
                {
                  // Ensure background doesn't move with keyboard
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
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
          <View style={styles.formContainer}>
            <View style={styles.cardContainer}>
              <Text style={styles.pageTitle}>{t("setMpinTitle")}</Text>
              <Text style={styles.subtitle}>{t("setMpinSubtitle")}</Text>
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
                  colors={[COLORS.secondary, COLORS.gold]}
                  style={styles.gradientButton}
                >
                  <View style={styles.buttonContent}>
                    {loading ? (
                      <>
                        <Ionicons
                          name="hourglass"
                          size={20}
                          color={theme.colors.textDark}
                        />
                        <Text style={styles.submitButtonText}>
                          {t("processing")}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={theme.colors.textDark}
                        />
                        <Text style={styles.submitButtonText}>
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
                  color={theme.colors.white}
                />
                <Text style={styles.backButtonText}>{t("backButton")}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    borderColor: "rgba(255, 255, 255, 0.3)",
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
    borderRadius: 25,
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
    color: theme.colors.white,
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
    color: theme.colors.textLight,
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

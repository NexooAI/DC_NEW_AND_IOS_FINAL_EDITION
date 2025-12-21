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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useGlobalStore from "@/store/global.store";

import { logger } from "@/utils/logger";
const { width } = Dimensions.get("window");

interface PinInputProps {
  value: string | null;
  isActive: boolean;
  onPress: () => void;
  index: number;
}

const PinInput = ({ value, isActive, onPress, index }: PinInputProps) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.pinBox}>
      <View style={[styles.pinBoxInner, isActive && styles.pinBoxActive]}>
        {value ? (
          <View style={styles.pinDot} />
        ) : (
          <Text style={styles.pinPlaceholder}>{index + 1}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function CompleteRegistration() {
  const { mobile, name, email, referral_code } = useLocalSearchParams();
  const router = useRouter();
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [activeInput, setActiveInput] = useState(0);

  const mpinRefs = Array.from({ length: 4 }, () => useRef<TextInput>(null));

  const showErrorAlert = (message: string) => {
    setErrorMessage(message);
    setShowError(true);
    setTimeout(() => setShowError(false), 3000);
  };

  const handlePinChange = (value: string, index: number) => {
    const newPins = [...mpin];
    newPins[index] = value;
    setMpin(newPins);

    // Move to next input if value is entered
    if (value && index < 3) {
      mpinRefs[index + 1].current?.focus();
      setActiveInput(index + 1);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === "Backspace" && !mpin[index] && index > 0) {
      mpinRefs[index - 1].current?.focus();
      setActiveInput(index - 1);
    }
  };

  const handleSubmit = async () => {
    const mpinValue = mpin.join("");

    if (mpinValue.length !== 4) {
      showErrorAlert("Please enter 4-digit MPIN");
      return;
    }

    if (!/^[0-9]{4}$/.test(mpinValue)) {
      showErrorAlert("MPIN can only contain numbers");
      return;
    }

    setLoading(true);
    try {
      // Call registration completion API
      const response = await api.post("/register/complete", {
        mobile,
        name,
        email,
        referral_code,
        mpin: mpinValue,
      });

      const data = response.data;
      logger.log("🔍 Registration completion response:", data);

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
          logger.log(
            "🔍 Setting user data in global store (Register complete):",
            {
              id: data.user.user_id,
              name: data.user.name,
              email: data.user.email,
              mobile: data.user.mobile_number,
              referralCode: data.user.referralCode,
              profile_photo: data.user.profile_photo,
              mpinStatus: data.user.mpinStatus,
              usertype: data.user.userType,
            }
          );
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
          logger.log(
            "🔍 Registration completion successful, navigating to home"
          );
          router.replace("/(app)/(tabs)/home");
        } catch (storageError) {
          logger.error("Error storing authentication data:", storageError);
          showErrorAlert("Failed to store authentication data");
        }
      } else {
        showErrorAlert(data.message || "Registration failed");
      }
    } catch (error: any) {
      showErrorAlert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={{ uri: theme.image.bg_image }}
      style={styles.backgroundImage}
    >
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.7)"]}
        style={styles.gradient}
      >
        {showError && (
          <View style={styles.errorAlert}>
            <View style={styles.errorContent}>
              <Ionicons name="alert-circle" size={24} color="#fff" />
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowError(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.formContainer}>
            <View style={styles.cardContainer}>
              <Text style={styles.pageTitle}>Complete Registration</Text>
              <Text style={styles.subtitle}>
                Create a 4-digit MPIN to secure your account
              </Text>

              {/* MPIN Input Boxes */}
              <View style={styles.pinContainer}>
                {mpin.map((digit, index) => (
                  <PinInput
                    key={index}
                    value={digit}
                    isActive={activeInput === index}
                    onPress={() => {
                      mpinRefs[index].current?.focus();
                      setActiveInput(index);
                    }}
                    index={index}
                  />
                ))}
              </View>

              {/* Hidden TextInput for actual input */}
              <TextInput
                style={styles.hiddenInput}
                ref={mpinRefs[0]}
                keyboardType="numeric"
                maxLength={4}
                value={mpin.join("")}
                onChangeText={(value) => {
                  const newPins = value.split("").slice(0, 4);
                  while (newPins.length < 4) newPins.push("");
                  setMpin(newPins);
                  setActiveInput(newPins.findIndex((pin) => pin === "") || 0);
                }}
                onKeyPress={(e) => handleKeyPress(e, activeInput)}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                <LinearGradient
                  colors={["#ffc90c", "#ffd700"]}
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
                          Processing...
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
                          Complete Registration
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
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </ImageBackground>
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
});

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  TextInput,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "@/services/api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "@/constants/colors";
import { LinearGradient } from "expo-linear-gradient";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import ResponsiveButton from "@/components/ResponsiveButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerStyles } from "../../_styles/registerStyles";

const { width } = Dimensions.get("window");

// 🔹 MPIN Input Box Component
const MpinInput = ({
  length = 4,
  onComplete,
  showValues = false,
  resetTrigger = 0,
}: {
  length?: number;
  onComplete: (value: string) => void;
  showValues?: boolean;
  resetTrigger?: number;
}) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<Array<TextInput | null>>(Array(length).fill(null));

  // Reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0) {
      setValues(Array(length).fill(""));
      onComplete("");
    }
  }, [resetTrigger, length, onComplete]);

  const handleChange = (text: string, index: number) => {
    const newValues = [...values];
    newValues[index] = text.slice(-1);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (!text && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    setValues(newValues);
    onComplete(newValues.join(""));
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !values[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.mpinInputContainer}>
      {values.map((value, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputs.current[index] = ref;
          }}
          style={styles.mpinInput}
          keyboardType="number-pad"
          maxLength={1}
          secureTextEntry={!showValues}
          value={value}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          textAlign="center"
        />
      ))}
    </View>
  );
};

export default function MpinSetup() {
  const { name, email, mobile, referral_code } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMpin, setShowMpin] = useState(false);
  const [showConfirmMpin, setShowConfirmMpin] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const { login, isLoggedIn } = useGlobalStore();
  useEffect(() => {
    if (mpin.length === 4 && confirmMpin.length === 4 && mpin !== confirmMpin) {
      Alert.alert(t("error"), t("mpinMismatchError"));
    }
  }, [mpin, confirmMpin]);

  const handleReset = () => {
    setMpin("");
    setConfirmMpin("");
    setResetTrigger((prev) => prev + 1);
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (mpin !== confirmMpin) {
      Alert.alert(t("error"), t("mpinMismatchError"));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/register/complete", {
        name,
        email,
        mobile_number: mobile,
        mpin,
        password: mpin,
        referral_code: referral_code || "",
      });

      if (response.status === 200) {
        const data = response.data;
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken);
        await SecureStore.setItemAsync("token", data.token);
        await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        login(data.token, {
          id: data.user.user_id,
          name: data.user.name,
          email: data.user.email,
          mobile: data.user.mobile_number,
          referralCode: data.user.referralCode,
          profile_photo: data.user.profile_photo,
          mpinStatus: data.user.mpinStatus,
          usertype: data.user.userType,
        });

        router.replace("/(app)/(tabs)/home");
      }
    } catch (error: any) {
      Alert.alert(
        t("error"),
        error.response?.data?.message || t("registrationFailed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require("../../../assets/images/bg_login.jpg")}
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.6)", "transparent"]}
          style={styles.gradient}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            {/* Header with Back Button */}
            {/* <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("setMpinTitle")}</Text>
              <View style={styles.headerSpacer} />
            </View> */}

            <View style={styles.mainContent}>
              {/* <Image
                source={require("../../../assets/images/logo_trans.png")}
                style={styles.logo}
                resizeMode="contain"
              /> */}

              <Text style={styles.pageTitle}>{t("setMpinTitle")}</Text>
              <Text style={styles.pageSubtitle}>{t("setMpinSubtitle")}</Text>

              <Text style={styles.sectionLabel}>{t("createMpinLabel")}</Text>
              <View style={styles.mpinSection}>
                <MpinInput
                  onComplete={setMpin}
                  showValues={showMpin}
                  resetTrigger={resetTrigger}
                />
                <TouchableOpacity
                  onPress={() => setShowMpin(!showMpin)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showMpin ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>{t("confirmMpinLabel")}</Text>
              <View style={styles.mpinSection}>
                <MpinInput
                  onComplete={setConfirmMpin}
                  showValues={showConfirmMpin}
                  resetTrigger={resetTrigger}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmMpin(!showConfirmMpin)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmMpin ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <ResponsiveButton
                  title={loading ? t("processing") : t("setMpinButton")}
                  variant="secondary"
                  size="lg"
                  fullWidth={true}
                  loading={loading}
                  disabled={
                    mpin.length !== 4 ||
                    confirmMpin.length !== 4 ||
                    mpin !== confirmMpin
                  }
                  onPress={handleSubmit}
                  style={styles.submitButton}
                />

                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity
                    onPress={handleReset}
                    style={styles.actionButton}
                  >
                    <Ionicons name="refresh" size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>{t("reset")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleBack}
                    style={styles.actionButton}
                  >
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={COLORS.white}
                    />
                    <Text style={styles.actionButtonText}>{t("back")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backgroundImage: { flex: 1, resizeMode: "cover" },
  gradient: { flex: 1 },
  keyboardAvoidingView: { flex: 1, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: { alignItems: "center", padding: 20 },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.white,
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  mpinSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  mpinInputContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  mpinInput: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.white,
    color: COLORS.white,
    fontSize: 20,
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  eyeButton: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 20,
    gap: 15,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minWidth: 100,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  submitButton: {
    marginTop: 0,
  },
});

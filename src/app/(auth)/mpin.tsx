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
  Keyboard,
  Pressable,
  StatusBar,
  ScrollView,
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
import { theme } from "@/constants";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { useAppVisibility } from "@/hooks/useAppVisibility";
const { hp } = responsiveUtils;
import Svg, { Path } from 'react-native-svg';

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
  const { name, email, mobile, referral_code, branch_id } = useLocalSearchParams();
  const { isVisible } = useAppVisibility();
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
        branch_id: branch_id ? Number(branch_id) : null,
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

        try {
          const visResponse = await api.get('/app-visible', {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          if (visResponse.data) {
            useGlobalStore.getState().setCachedVisibility(visResponse.data);
            if (visResponse.data.showDashboardAfterLogin === 0) {
              router.replace("/(app)/(tabs)/home");
              return;
            }
          }
        } catch (visError) {
          console.error("Error fetching visibility config in mpin.tsx:", visError);
        }

        router.replace("/(app)/dashboard");
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
    <View
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={undefined}
          style={styles.keyboardAvoidingView}
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
                        source={require("../../../assets/images/intro_1.png")}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
                  {/* Back arrow in small gold circle */}
                  <TouchableOpacity
                    onPress={handleBack}
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
                        color={COLORS.primary}
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
                        color={COLORS.primary}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonContainer}>
                    <ResponsiveButton
                      title={loading ? t("processing") : t("setMpinButton")}
                      backgroundColor={theme.colors.primary}
                      textColor="#FFFFFF"
                      variant="primary"
                      size="lg"
                      fullWidth={true}
                      loading={loading}
                      disabled={
                        mpin.length !== 4 ||
                        confirmMpin.length !== 4 ||
                        mpin !== confirmMpin
                      }
                      onPress={handleSubmit}
                      style={[styles.submitButton, { height: 48, minHeight: 48, borderRadius: 8 }]}
                    />

                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        onPress={handleReset}
                        style={styles.actionButton}
                      >
                        <Ionicons name="refresh" size={20} color={COLORS.primary} />
                        <Text style={styles.actionButtonText}>{t("reset")}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleBack}
                        style={styles.actionButton}
                      >
                        <Ionicons
                          name="arrow-back"
                          size={20}
                          color={COLORS.primary}
                        />
                        <Text style={styles.actionButtonText}>{t("back")}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
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
    color: COLORS.primary,
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
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: "center",
    opacity: 0.8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
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
    borderColor: "#cbd5e1",
    color: COLORS.primary,
    fontSize: 20,
    textAlign: "center",
    backgroundColor: "#f8fafc",
  },
  eyeButton: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
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
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    minWidth: 100,
  },
  actionButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  submitButton: {
    marginTop: 0,
  },
});

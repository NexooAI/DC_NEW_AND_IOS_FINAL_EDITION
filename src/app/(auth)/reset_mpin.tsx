import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import MpinInput from "@/components/MpinInput";
import api from "@/services/api";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";

const { width, height } = Dimensions.get("window");

export default function ResetMpin() {
  const router = useRouter();
  const { user } = useGlobalStore();
  const { t } = useTranslation();
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [showMpin, setShowMpin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleNewMpinComplete = (value: string) => {
    setNewMpin(value);
  };

  const handleConfirmMpinComplete = (value: string) => {
    setConfirmMpin(value);
  };

  const toggleShowMpin = () => {
    setShowMpin(!showMpin);
  };

  const handleResetMpin = async () => {
    if (newMpin.length !== 4) {
      Alert.alert(t("mpinResetFailedTitle"), t("pleaseEnter4DigitMpin"));
      return;
    }

    if (confirmMpin.length !== 4) {
      Alert.alert(t("mpinResetFailedTitle"), t("pleaseConfirm4DigitMpin"));
      return;
    }

    if (newMpin !== confirmMpin) {
      Alert.alert(t("mpinResetFailedTitle"), t("mpinMismatchError"));
      return;
    }

    if (!user?.mobile) {
      Alert.alert(t("mpinResetFailedTitle"), t("mobileNumberNotFound"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-mpin", {
        mobile: user.mobile.toString(),
        newMpin: newMpin,
      });

      if (response.data.message === "MPIN reset successfully") {
        Alert.alert(t("mpinResetSuccessTitle"), t("mpinResetSuccessMessage"), [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert(
          t("mpinResetFailedTitle"),
          response.data.message || t("mpinResetFailedMessage")
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || t("mpinResetFailedGenericMessage");
      Alert.alert(t("mpinResetFailedTitle"), errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/bg_new.jpg")}
      style={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBackPress}
              >
                <Ionicons name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t("resetMpinTitle")}</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Main Content Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t("resetMpinTitle")}</Text>
              <Text style={styles.cardSubtitle}>{t("resetMpinSubtitle")}</Text>

              {/* New MPIN Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("newMpin")}</Text>
                <MpinInput
                  length={4}
                  onComplete={handleNewMpinComplete}
                  secureTextEntry={!showMpin}
                  inputStyle={styles.mpinInput}
                  containerStyle={styles.mpinContainer}
                />
              </View>

              {/* Confirm MPIN Section */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>{t("confirmMpin")}</Text>
                <MpinInput
                  length={4}
                  onComplete={handleConfirmMpinComplete}
                  secureTextEntry={!showMpin}
                  inputStyle={styles.mpinInput}
                  containerStyle={styles.mpinContainer}
                />
              </View>

              {/* Show MPIN Button */}
              <TouchableOpacity
                style={styles.showMpinButton}
                onPress={toggleShowMpin}
              >
                <Ionicons
                  name={showMpin ? "eye-off" : "eye"}
                  size={20}
                  color="#ffc90c"
                />
                <Text style={styles.showMpinText}>{t("showMpin")}</Text>
              </TouchableOpacity>

              {/* Reset MPIN Button */}
              <TouchableOpacity
                style={[
                  styles.resetButton,
                  isLoading && styles.resetButtonDisabled,
                ]}
                onPress={handleResetMpin}
                disabled={isLoading}
              >
                <Text style={styles.resetButtonText}>
                  {isLoading ? t("resettingMpin") : t("resetMpin")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent", // Changed to transparent to show background image
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    backgroundColor: theme.colors.primary, // Dark red header
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    fontFamily: "sans-serif",
  },
  headerSpacer: {
    width: 34, // Same width as back button for centering
  },
  card: {
    backgroundColor: "rgba(64, 64, 64, 0.9)", // Dark gray with transparency
    borderRadius: 12,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    fontFamily: "sans-serif",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#cccccc",
    textAlign: "center",
    marginBottom: 32,
    fontFamily: "sans-serif",
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    marginBottom: 12,
    fontFamily: "sans-serif",
  },
  mpinContainer: {
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  mpinInput: {
    width: 60,
    height: 60,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 8,
    fontSize: 24,
    color: "#000000",
    backgroundColor: "#ffffff",
    textAlign: "center",
  },
  showMpinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  showMpinText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#ffc90c",
    fontWeight: "600",
    fontFamily: "sans-serif",
  },
  resetButton: {
    backgroundColor: "#ffc90c", // Mustard yellow
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  resetButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2e0406", // Dark brown text
    fontFamily: "sans-serif",
  },
});

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
import { LinearGradient } from "expo-linear-gradient";
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
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Fixed Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{t("resetMpinTitle")}</Text>
              <Text style={styles.headerSubtitle}>{t("resetMpinSubtitle")}</Text>
            </View>
            <View style={styles.headerRightPlaceholder} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >

          {/* Main Content Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("newMpin") || "Enter New MPIN"}</Text>

            {/* New MPIN Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t("newMpin")}</Text>
              <MpinInput
                length={4}
                onComplete={handleNewMpinComplete}
                secureTextEntry={!showMpin}
              />
            </View>

            {/* Confirm MPIN Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>{t("confirmMpin")}</Text>
              <MpinInput
                length={4}
                onComplete={handleConfirmMpinComplete}
                secureTextEntry={!showMpin}
              />
            </View>

            {/* Show MPIN Button */}
            <TouchableOpacity
              style={styles.showMpinButton}
              onPress={toggleShowMpin}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showMpin ? "eye-off" : "eye"}
                size={20}
                color={theme.colors.primary}
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
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ["#ccc", "#999"] : ["#DAA520", "#B8860B"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Text style={styles.resetButtonText}>
                {isLoading ? t("resettingMpin") : t("resetMpin")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 10,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.quaternary || "#F2E6D2",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerRightPlaceholder: {
    width: 40,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    textAlign: "center",
    marginBottom: 25,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  mpinContainer: {
    justifyContent: "space-between",
  },
  mpinInput: {
    width: (width - 100) / 4,
    height: 60,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 24,
    color: "#1a1a1a",
    backgroundColor: "#F8FAFC",
    textAlign: "center",
  },
  showMpinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginBottom: 25,
  },
  showMpinText: {
    marginLeft: 10,
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  resetButtonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
});

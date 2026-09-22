import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";

interface ReferralCodeCardV2Props {
  code: string;
  onCodeCopied?: () => void;
}

export const ReferralCodeCardV2: React.FC<ReferralCodeCardV2Props> = ({
  code,
  onCodeCopied,
}) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setIsCopied(true);
    if (onCodeCopied) onCodeCopied();

    Alert.alert(
      t("copied") || "Copied!",
      (t("referral_code_copied") || "Referral Code copied to clipboard: ") + code,
      [{ text: "OK" }]
    );

    setTimeout(() => {
      setIsCopied(false);
    }, 2500);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#FDFBF7"]}
        style={styles.gradientCard}
      >
        <View style={styles.contentRow}>
          <View style={styles.textColumn}>
            <Text style={styles.label}>
              {t("refer_earn_your_code") || "Your Referral Code:"}
            </Text>
            <Text style={styles.codeText} selectable>
              {code}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.copyButton, isCopied && styles.copyButtonActive]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isCopied ? ["#4CAF50", "#2E7D32"] : ["#FFE082", "#FFC107"]}
              style={styles.copyBtnGradient}
            >
              <Ionicons
                name={isCopied ? "checkmark-circle" : "copy-outline"}
                size={16}
                color={isCopied ? "#FFF" : "#5D4037"}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.copyBtnText,
                  { color: isCopied ? "#FFFFFF" : "#5D4037" },
                ]}
              >
                {isCopied ? (t("copied") || "COPIED") : (t("copy") || "COPY")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gradientCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textColumn: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: "#795548",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: 1.5,
  },
  copyButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  copyButtonActive: {
    transform: [{ scale: 0.98 }],
  },
  copyBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});

export default ReferralCodeCardV2;

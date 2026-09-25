import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";

const { width: screenWidth } = Dimensions.get("window");

interface InvalidMobileModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
  mobileNumber: string;
}

export default function InvalidMobileModal({
  visible,
  onClose,
  onCreateAccount,
  mobileNumber,
}: InvalidMobileModalProps) {
  const { t } = useTranslation();
  const primaryColor = theme.colors.primary || "#0e1e38";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close button in top right corner */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={22} color="#6b7280" />
          </TouchableOpacity>

          {/* Header & Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(212, 175, 55, 0.15)" }]}>
              <Ionicons
                name="person-add-outline"
                size={34}
                color={primaryColor}
              />
            </View>
            <Text style={styles.modalTitle}>
              {t("numberNotRegistered") || "Number Not Registered"}
            </Text>

            {/* Styled badge for Mobile Number */}
            {mobileNumber ? (
              <View style={styles.numberBadge}>
                <Text style={styles.numberBadgeText}>+91 {mobileNumber}</Text>
              </View>
            ) : null}
          </View>

          {/* Description Content */}
          <View style={styles.descContainer}>
            <Text style={styles.descText}>
              {t("mobileNotRegisteredDesc") ||
                "This mobile number is not registered with our system. Would you like to create a new account to start your savings?"}
            </Text>
          </View>

          {/* Action Button */}
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: primaryColor }]}
              onPress={onCreateAccount}
              activeOpacity={0.88}
            >
              <Ionicons
                name="person-add"
                size={18}
                color="#d4af37"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.createBtnText}>
                {t("createAccount") || "Register"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: Math.min(screenWidth * 0.9, 380),
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  numberBadge: {
    marginTop: 10,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  numberBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    letterSpacing: 0.5,
  },
  descContainer: {
    paddingBottom: 20,
  },
  descText: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 21,
  },
  buttonWrapper: {
    width: "100%",
  },
  createBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  createBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

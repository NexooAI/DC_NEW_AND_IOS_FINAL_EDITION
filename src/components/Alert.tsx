// components/Alert.tsx
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  Clipboard,
  ToastAndroid,
  Platform,
  Alert as RNAlert,
} from "react-native";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

type AlertProps = {
  visible: boolean;
  title?: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: "default" | "cancel" | "destructive";
  }>;
  onClose: () => void;
  txn_id?: string;
  amount?: number | string;
  order_id?: string;
};
const copyToClipboard = (text: string, label: string) => {
  Clipboard.setString(text);
  if (Platform.OS === "android") {
    ToastAndroid.show(`${label} copied to clipboard`, ToastAndroid.SHORT);
  } else {
    RNAlert.alert("Copied", `${label} copied to clipboard`);
  }
};

const CustomAlert = ({
  visible,
  title,
  message,
  type = "info",
  buttons = [{ text: "OK", onPress: () => {} }],
  onClose,
  txn_id,
  amount,
  order_id,
}: AlertProps) => {
  const {
    screenWidth,
    isTinyScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isTablet,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveWidth,
    fontSize,
    padding,
    spacing,
  } = useResponsiveLayout();

  const getIcon = () => {
    const iconSize = deviceScale(32);
    switch (type) {
      case "success":
        return (
          <Ionicons
            name="checkmark-circle"
            size={iconSize}
            color={theme.colors.success}
          />
        );
      case "error":
        return (
          <Ionicons
            name="close-circle"
            size={iconSize}
            color={theme.colors.error}
          />
        );
      case "warning":
        return (
          <Ionicons
            name="warning"
            size={iconSize}
            color={theme.colors.warning}
          />
        );
      case "info":
        return (
          <Ionicons
            name="information-circle"
            size={iconSize}
            color={theme.colors.info}
          />
        );
      default:
        return (
          <Ionicons
            name="information-circle"
            size={iconSize}
            color={theme.colors.info}
          />
        );
    }
  };

  // Calculate responsive container width
  const getContainerWidth = () => {
    if (isTinyScreen) return getResponsiveWidth(95); // 95% on tiny screens
    if (isSmallScreen) return getResponsiveWidth(90); // 90% on small screens
    if (isMediumScreen) return getResponsiveWidth(85); // 85% on medium screens
    if (isLargeScreen) return getResponsiveWidth(80); // 80% on large screens
    if (isTablet) return getResponsiveWidth(60); // 60% on tablets
    return getResponsiveWidth(75); // Default 75%
  };

  const containerWidth = getContainerWidth();
  const maxWidth = isTablet ? 500 : 400;
  const finalWidth = Math.min(containerWidth, maxWidth);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { width: finalWidth }]}>
          <View style={styles.header}>
            {getIcon()}
            <Text
              style={[
                styles.title,
                {
                  fontSize: getResponsiveFontSize(18, 20, 22),
                  paddingHorizontal: padding.sm,
                },
              ]}
              numberOfLines={0}
              adjustsFontSizeToFit={true}
            >
              {title || type.toUpperCase()}
            </Text>
          </View>

          <View style={styles.content}>
            <Text
              style={[
                styles.message,
                {
                  fontSize: getResponsiveFontSize(16, 18, 20),
                  lineHeight: getResponsiveFontSize(20, 24, 28),
                },
              ]}
              numberOfLines={0}
            >
              {message}
            </Text>

            {(txn_id || order_id || amount) && (
              <View style={styles.paymentDetailsContainer}>
                {txn_id && (
                  <View style={styles.paymentRow}>
                    <Text
                      style={[
                        styles.paymentLabel,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      Transaction ID:
                    </Text>
                    <Text
                      style={[
                        styles.paymentValue,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      {txn_id}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(txn_id, "Transaction ID")}
                      style={[
                        styles.copyButton,
                        {
                          paddingVertical: getResponsivePadding(4, 6, 8),
                          paddingHorizontal: getResponsivePadding(8, 12, 16),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.copyButtonText,
                          { fontSize: getResponsiveFontSize(16, 18, 20) },
                        ]}
                      >
                        Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {order_id && (
                  <View style={styles.paymentRow}>
                    <Text
                      style={[
                        styles.paymentLabel,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      Order ID:
                    </Text>
                    <Text
                      style={[
                        styles.paymentValue,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      {order_id}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(order_id, "Order ID")}
                      style={[
                        styles.copyButton,
                        {
                          paddingVertical: getResponsivePadding(4, 6, 8),
                          paddingHorizontal: getResponsivePadding(8, 12, 16),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.copyButtonText,
                          { fontSize: getResponsiveFontSize(16, 18, 20) },
                        ]}
                      >
                        Copy
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {amount !== undefined && (
                  <View style={styles.paymentRow}>
                    <Text
                      style={[
                        styles.paymentLabel,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      Amount:
                    </Text>
                    <Text
                      style={[
                        styles.paymentValue,
                        { fontSize: getResponsiveFontSize(16, 18, 20) },
                      ]}
                    >
                      ₹{amount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <View
            style={[
              styles.buttonContainer,
              {
                flexDirection: buttons.length > 2 ? "column" : "row",
                gap: spacing.sm,
              },
            ]}
          >
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
                style={[
                  styles.button,
                  {
                    flex: buttons.length <= 2 ? 1 : 0,
                    minHeight: deviceScale(44), // Minimum touch target
                    paddingVertical: getResponsivePadding(10, 12, 14),
                    paddingHorizontal: getResponsivePadding(12, 16, 20),
                  },
                  button.style === "destructive" && styles.destructiveButton,
                  button.style === "cancel" && styles.cancelButton,
                  button.style === "default" && styles.defaultButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      fontSize: getResponsiveFontSize(16, 18, 20),
                      textAlign: "center",
                    },
                    button.style === "destructive" &&
                      styles.destructiveButtonText,
                    button.style === "cancel" && styles.cancelButtonText,
                    button.style === "default" && styles.defaultButtonText,
                  ]}
                  numberOfLines={0}
                  adjustsFontSizeToFit={true}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16, // Add horizontal padding for very small screens
  },
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 20,
    margin: 20,
    // Remove fixed width constraints - now handled dynamically
    shadowColor: theme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    flexWrap: "wrap", // Allow wrapping on very small screens
    width: "100%",
  },
  title: {
    fontWeight: "bold",
    color: theme.colors.textDark,
    textAlign: "center",
    marginTop: 10,
    flexShrink: 1, // Allow text to shrink if needed
    width: "100%",
    alignSelf: "center",
  },
  content: {
    padding: 16,
  },
  message: {
    color: theme.colors.textDarkGrey,
    textAlign: "center", // Center align for better readability
    flexWrap: "wrap", // Allow text wrapping
  },
  paymentDetailsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentLabel: {
    flex: 2,
    fontWeight: "600",
    color: theme.colors.textMediumGrey,
  },
  paymentValue: {
    flex: 3,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  copyButton: {
    flex: 1,
    backgroundColor: "#FFD700", // Golden color
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  copyButtonText: {
    color: "#1a2a39", // Dark blue-gray
    fontWeight: "600",
    fontSize: 14,
  },
  buttonContainer: {
    justifyContent: "space-around",
    // flexDirection and gap are now handled dynamically
  },
  button: {
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    // flex, padding, and minHeight are now handled dynamically
  },
  defaultButton: {
    backgroundColor: "#FFD700", // Golden color
  },
  destructiveButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5", // Light gray
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  defaultButtonText: {
    color: "#1a2a39", // Dark blue-gray
  },
  destructiveButtonText: {
    color: theme.colors.white,
  },
  cancelButtonText: {
    color: "#1a2a39", // Dark blue-gray
  },
});

export default CustomAlert;

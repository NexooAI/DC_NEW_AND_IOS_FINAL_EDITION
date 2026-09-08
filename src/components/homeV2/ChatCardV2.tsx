import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import useGlobalStore, { useAppTheme } from "@/store/global.store";

interface ChatCardV2Props {
  onPress?: () => void;
}

export const ChatCardV2: React.FC<ChatCardV2Props> = ({ onPress }) => {
  const router = useRouter();
  const theme = useAppTheme();

  const handleChatPress = () => {
    if (onPress) {
      onPress();
    } else {
      const rawNumber =
        (theme.constants as any)?.whatsapp ||
        (theme.constants as any)?.mobile ||
        "919876543210";
      const cleanNumber = String(rawNumber).replace(/[^\d]/g, "");
      const text = encodeURIComponent("Hello! I need help with my jewellery savings chit.");
      const url = `whatsapp://send?phone=${cleanNumber}&text=${text}`;
      const webUrl = `https://wa.me/${cleanNumber}?text=${text}`;

      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Linking.openURL(webUrl);
          }
        })
        .catch(() => {
          router.push("/(app)/(tabs)/home/faq-chat" as any);
        });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleChatPress}
        activeOpacity={0.88}
      >
        {/* Left Green Chat Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="chatbubble-ellipses" size={22} color="#FFFFFF" />
        </View>

        {/* Center Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Chat With Us</Text>
          <Text style={styles.subtitle}>Get instant support</Text>
        </View>

        {/* Right Action Button */}
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>Start Chat</Text>
          <Ionicons name="arrow-forward" size={12} color="#047857" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5", // Soft mint green
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "#10B981", // Emerald green
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#065F46",
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: "#047857",
    marginTop: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#059669",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: "#FFFFFF",
    gap: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#047857",
  },
});

export default ChatCardV2;

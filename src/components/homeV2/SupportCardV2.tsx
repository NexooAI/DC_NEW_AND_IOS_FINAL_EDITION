import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import useGlobalStore, { useAppTheme } from "@/store/global.store";

interface SupportCardV2Props {
  onPress?: () => void;
}

export const SupportCardV2: React.FC<SupportCardV2Props> = ({ onPress }) => {
  const router = useRouter();
  const theme = useAppTheme();

  const handleSupportPress = () => {
    if (onPress) {
      onPress();
    } else {
      const mobile = (theme.constants as any)?.mobile || "919876543210";
      Linking.openURL(`tel:${mobile}`).catch(() => {
        router.push("/(app)/(tabs)/home/faq" as any);
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleSupportPress}
        activeOpacity={0.88}
      >
        {/* Left Headset Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="headset" size={24} color="#003C28" />
        </View>

        {/* Center Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Need Help?</Text>
          <Text style={styles.subtitle}>We're here for you</Text>
        </View>

        {/* Right Action Button */}
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>Contact Support</Text>
          <Ionicons name="arrow-forward" size={12} color="#003C28" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(6),
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: "rgba(0, 60, 40, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: "rgba(0, 60, 40, 0.08)",
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
    color: "#0F172A",
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#003C28",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    backgroundColor: "#FFFFFF",
    gap: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
    color: "#003C28",
  },
});

export default SupportCardV2;

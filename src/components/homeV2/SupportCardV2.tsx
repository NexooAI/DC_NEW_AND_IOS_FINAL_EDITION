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
import { useTranslation } from "@/hooks/useTranslation";

interface SupportCardV2Props {
  onPress?: () => void;
}

export const SupportCardV2: React.FC<SupportCardV2Props> = ({ onPress }) => {
  const router = useRouter();
  const theme = useAppTheme();
  const { t } = useTranslation();

  const primaryColor = theme.colors.primary || "#2F2483";

  const handleSupportPress = () => {
    if (onPress) {
      onPress();
    } else {
      const mobile = (theme.constants as any)?.mobile || "+919486611921";
      Linking.openURL(`tel:${mobile}`).catch(() => {
        router.push("/(app)/(tabs)/home/faq" as any);
      });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, { borderColor: "rgba(47, 36, 131, 0.14)" }]}
        onPress={handleSupportPress}
        activeOpacity={0.88}
      >
        {/* Left Headset Icon with Royal Indigo Background */}
        <View style={[styles.iconCircle, { backgroundColor: "rgba(47, 36, 131, 0.08)" }]}>
          <Ionicons name="headset" size={22} color={primaryColor} />
        </View>

        {/* Center Text */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {t("needHelp", { defaultValue: "Need Assistance?" })}
          </Text>
          <Text style={styles.subtitle}>
            {t("dindigulShowroomHelp", { defaultValue: "Theni Anantham Dindigul Helpline" })}
          </Text>
        </View>

        {/* Right Action Button */}
        <View style={styles.actionButton}>
          <Text style={[styles.actionText, { color: primaryColor }]}>
            {t("contactSupport", { defaultValue: "Call Now" })}
          </Text>
          <Ionicons name="arrow-forward" size={12} color={primaryColor} />
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
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1.2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(13.5),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: "500",
    color: "#64748B",
    marginTop: moderateScale(2),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(47, 36, 131, 0.06)",
  },
  actionText: {
    fontSize: moderateScale(11.5),
    fontWeight: "700",
  },
});

export default SupportCardV2;

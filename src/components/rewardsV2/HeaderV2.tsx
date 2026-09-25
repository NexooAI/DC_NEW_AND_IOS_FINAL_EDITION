import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/store/global.store";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderV2Props {
  onBack?: () => void;
  onHistoryPress?: () => void;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({ onBack, onHistoryPress }) => {
  const theme = useAppTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleHistory = () => {
    if (onHistoryPress) {
      onHistoryPress();
    } else {
      router.push("/(app)/(tabs)/rewards_history");
    }
  };

  const headerBg = theme?.colors?.background || "#FFFFFF";
  const textColor = theme?.colors?.textDark || "#1A1A1A";

  return (
    <View style={[styles.headerContainer, { backgroundColor: headerBg }]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: textColor }]} numberOfLines={1}>
          {t("rewards_refer_title") || t("rewardPoints") || "Rewards & Refer"}
        </Text>

        <TouchableOpacity
          style={styles.historyPillButton}
          onPress={handleHistory}
          activeOpacity={0.8}
        >
          <Ionicons name="receipt-outline" size={14} color="#5D4037" style={{ marginRight: 4 }} />
          <Text style={styles.historyPillText}>{t("history") || "History"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginHorizontal: 8,
  },
  historyPillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  historyPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5D4037",
  },
});

export default HeaderV2;

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";

interface QuickActionsV2Props {
  onMyChitsPress?: () => void;
  onQuickPayPress?: () => void;
  onReceiptsPress?: () => void;
  onRateChartPress?: () => void;
  onStoresPress?: () => void;
  onStatementsPress?: () => void;
  onViewAllPress?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({
  onMyChitsPress,
  onQuickPayPress,
  onReceiptsPress,
  onRateChartPress,
  onStoresPress,
  onStatementsPress,
  onViewAllPress,
}) => {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const isCompactLocale = locale === "ta" || locale === "mal" || locale === "te";

  const handleMyChits = () => {
    if (onMyChitsPress) {
      onMyChitsPress();
    } else {
      router.push("/(app)/(tabs)/savings");
    }
  };

  const handleQuickPay = () => {
    if (onQuickPayPress) {
      onQuickPayPress();
    } else {
      router.push("/(app)/(tabs)/quick_join");
    }
  };

  const handleReceipts = () => {
    if (onReceiptsPress) {
      onReceiptsPress();
    } else if (onStatementsPress) {
      onStatementsPress();
    } else {
      router.push({ pathname: "/(app)/payment-history", params: { from: "home" } });
    }
  };

  const handleRateChart = () => {
    if (onRateChartPress) {
      onRateChartPress();
    } else {
      router.push("/(app)/(tabs)/home/ratechart");
    }
  };

  const handleStores = () => {
    if (onStoresPress) {
      onStoresPress();
    } else {
      router.push("/(app)/(tabs)/home/our_stores");
    }
  };

  const handleViewAll = () => {
    if (onViewAllPress) {
      onViewAllPress();
    } else {
      router.push("/(app)/(tabs)/savings");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text
          style={[styles.title, isCompactLocale && { fontSize: moderateScale(14) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {t("quickActions", { defaultValue: "Quick Actions" })}
        </Text>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text
            style={[styles.viewAllText, isCompactLocale && { fontSize: moderateScale(11) }]}
            numberOfLines={1}
          >
            {t("viewAll", { defaultValue: "View All" })}
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#850111" />
        </TouchableOpacity>
      </View>

      {/* 5 Actions Horizontal Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {/* 1. My Schemes */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleMyChits}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="wallet-outline" size={22} color="#850111" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {t("mySchemes", { defaultValue: "My Schemes" })}
          </Text>
        </TouchableOpacity>

        {/* 2. Quick Pay */}
        {/* <TouchableOpacity
          style={styles.actionCard}
          onPress={handleQuickPay}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="flash-outline" size={22} color="#850111" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {t("quickPay", { defaultValue: "Quick Pay" })}
          </Text>
        </TouchableOpacity> */}

        {/* 3. Receipts */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleReceipts}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="receipt-outline" size={22} color="#850111" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {t("receipts", { defaultValue: "Receipts" })}
          </Text>
        </TouchableOpacity>

        {/* 4. Gold Rate Chart */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleRateChart}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="trending-up-outline" size={22} color="#B8860B" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {t("goldRate", { defaultValue: "Gold Rate" })}
          </Text>
        </TouchableOpacity>

        {/* 5. Our Stores */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleStores}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="location-outline" size={22} color="#850111" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {t("ourStores", { defaultValue: "Our Stores" })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(8),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  title: {
    flex: 1,
    marginRight: moderateScale(8),
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#850111", // Royal Temple Burgundy
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 3,
  },
  viewAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#850111",
  },
  actionsRow: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  actionCard: {
    minWidth: moderateScale(96),
    height: moderateScale(72),
    borderRadius: moderateScale(14),
    backgroundColor: "#FFFDF9", // Warm Ivory Cream
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)", // Subtle gold rim
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrapper: {
    marginBottom: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#4A0E17", // Rich Deep Maroon
    textAlign: "center",
  },
});

export default QuickActionsV2;

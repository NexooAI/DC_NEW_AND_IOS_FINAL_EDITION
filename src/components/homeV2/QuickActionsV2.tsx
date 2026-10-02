import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/store/global.store";

import { themeConfig } from "@/constants/theme.config";

interface QuickActionsV2Props {
  onMyChitsPress?: () => void;
  onQuickPayPress?: () => void;
  onReceiptsPress?: () => void;
  onRateChartPress?: () => void;
  onStoresPress?: () => void;
  onReferPress?: () => void;
  onViewAllPress?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({
  onMyChitsPress,
  onQuickPayPress,
  onReceiptsPress,
  onRateChartPress,
  onStoresPress,
  onReferPress,
  onViewAllPress,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();

  const isTextile = (themeConfig as any)?.businessType === "textile";
  const showroomCity = (themeConfig as any)?.city || "Dindigul";

  const primaryColor = theme.colors.primary || "#D81E27";
  const secondaryColor = theme.colors.secondary || "#FFD200";

  const actions = [
    {
      id: "my_schemes",
      title: t("mySchemes", { defaultValue: "My Schemes" }),
      icon: "wallet-outline" as const,
      color: primaryColor,
      bg: "rgba(128, 0, 32, 0.08)",
      borderColor: "rgba(128, 0, 32, 0.16)",
      onPress: () => {
        if (onMyChitsPress) onMyChitsPress();
        else router.push("/(app)/(tabs)/savings");
      },
    },
    {
      id: "quick_pay",
      title: t("quickPay", { defaultValue: "Quick Pay" }),
      icon: "flash-outline" as const,
      color: "#B45309",
      bg: "rgba(223, 180, 91, 0.14)",
      borderColor: "rgba(223, 180, 91, 0.35)",
      onPress: () => {
        if (onQuickPayPress) onQuickPayPress();
        else router.push("/(app)/(tabs)/quick_join");
      },
    },
    {
      id: "receipts",
      title: t("receipts", { defaultValue: "Receipts" }),
      icon: "receipt-outline" as const,
      color: primaryColor,
      bg: "rgba(128, 0, 32, 0.08)",
      borderColor: "rgba(128, 0, 32, 0.16)",
      onPress: () => {
        if (onReceiptsPress) onReceiptsPress();
        else router.push({ pathname: "/(app)/payment-history", params: { from: "home" } });
      },
    },
    ...(isTextile
      ? [
          {
            id: "special_offers",
            title: t("specialOffers", { defaultValue: "Offers / சலுகை" }),
            icon: "sparkles-outline" as const,
            color: "#B45309",
            bg: "rgba(223, 180, 91, 0.14)",
            borderColor: "rgba(223, 180, 91, 0.35)",
            onPress: () => {
              router.push("/(app)/(tabs)/home/offers");
            },
          },
        ]
      : [
          {
            id: "rate_chart",
            title: t("goldRate", { defaultValue: "Rate Chart" }),
            icon: "trending-up-outline" as const,
            color: "#9A6B00",
            bg: "rgba(212, 175, 55, 0.12)",
            borderColor: "rgba(212, 175, 55, 0.3)",
            onPress: () => {
              if (onRateChartPress) onRateChartPress();
              else router.push("/(app)/(tabs)/home/ratechart");
            },
          },
        ]),
    {
      id: "our_stores",
      title: t("ourStores", { defaultValue: showroomCity }),
      icon: "location-outline" as const,
      color: primaryColor,
      bg: "rgba(128, 0, 32, 0.08)",
      borderColor: "rgba(128, 0, 32, 0.16)",
      onPress: () => {
        if (onStoresPress) onStoresPress();
        else router.push("/(app)/(tabs)/home/our_stores");
      },
    },
    {
      id: "refer_earn",
      title: t("referEarn", { defaultValue: "Refer & Win" }),
      icon: "gift-outline" as const,
      color: "#9333EA",
      bg: "rgba(147, 51, 234, 0.08)",
      borderColor: "rgba(147, 51, 234, 0.18)",
      onPress: () => {
        if (onReferPress) onReferPress();
        else router.push("/(app)/(tabs)/home/refer_earn");
      },
    },
  ];

  const handleViewAll = () => {
    if (onViewAllPress) onViewAllPress();
    else router.push("/(app)/(tabs)/savings");
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithAccent}>
          <View style={[styles.titleAccentBar, { backgroundColor: primaryColor }]} />
          <Text style={styles.title}>
            {t("quickActions", { defaultValue: "Quick Services" })}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={[styles.viewAllText, { color: primaryColor }]}>
            {t("viewAll", { defaultValue: "View All" })}
          </Text>
          <Ionicons name="arrow-forward" size={13} color={primaryColor} />
        </TouchableOpacity>
      </View>

      {/* 6 Actions Horizontal Flow */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {actions.map((act) => (
          <TouchableOpacity
            key={act.id}
            style={[styles.actionCard, { borderColor: act.borderColor }]}
            onPress={act.onPress}
            activeOpacity={0.82}
          >
            <View style={[styles.iconWrapper, { backgroundColor: act.bg }]}>
              <Ionicons name={act.icon} size={22} color={act.color} />
            </View>
            <Text style={styles.actionText} numberOfLines={1}>
              {act.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: moderateScale(10),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(10),
  },
  titleWithAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },
  titleAccentBar: {
    width: moderateScale(3),
    height: moderateScale(16),
    borderRadius: moderateScale(2),
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(3),
  },
  viewAllText: {
    fontSize: moderateScale(12),
    fontWeight: "700",
  },
  actionsRow: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  actionCard: {
    width: moderateScale(92),
    height: moderateScale(76),
    borderRadius: moderateScale(14),
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(6),
    paddingVertical: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  iconWrapper: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(12),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(10.5),
    fontWeight: "700",
    color: "#1E293B",
    textAlign: "center",
  },
});

export default QuickActionsV2;

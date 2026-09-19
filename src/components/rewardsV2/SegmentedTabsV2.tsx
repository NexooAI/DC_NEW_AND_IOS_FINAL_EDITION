import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/store/global.store";

export type RewardsTabType = "refer" | "referrals" | "guide";

interface SegmentedTabsV2Props {
  activeTab: RewardsTabType;
  onTabChange: (tab: RewardsTabType) => void;
  referralsCount?: number;
}

export const SegmentedTabsV2: React.FC<SegmentedTabsV2Props> = ({
  activeTab,
  onTabChange,
  referralsCount = 0,
}) => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const primaryColor = theme?.colors?.primary || "#850111";

  const tabs: { key: RewardsTabType; label: string; badge?: number }[] = [
    {
      key: "refer",
      label: t("refer_earn_tab_refer") || "Refer & Earn",
    },
    {
      key: "referrals",
      label: t("refer_earn_tab_referrals") || "My Referrals",
      badge: referralsCount > 0 ? referralsCount : undefined,
    },
    {
      key: "guide",
      label: t("faqs_and_guide") || "FAQs & Guide",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.segmentedWrapper}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                isActive && { backgroundColor: primaryColor },
              ]}
              onPress={() => onTabChange(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {tab.badge !== undefined && (
                <View
                  style={[
                    styles.badgeContainer,
                    { backgroundColor: isActive ? "#FFD700" : "rgba(0,0,0,0.08)" },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: isActive ? "#1A1A1A" : "#666" },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
  },
  segmentedWrapper: {
    flexDirection: "row",
    backgroundColor: "#F3EFEA",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 11,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  tabLabelInactive: {
    color: "#5D4037",
  },
  badgeContainer: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
});

export default SegmentedTabsV2;

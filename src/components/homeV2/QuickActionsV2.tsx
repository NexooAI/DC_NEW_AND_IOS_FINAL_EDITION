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
import useGlobalStore from "@/store/global.store";

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
  const { language } = useGlobalStore();

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
      router.push("/(app)/payment-history");
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
        <Text style={styles.title}>
          {language === "ta" ? "விரைவு செயல்கள்" : "Quick Actions"}
        </Text>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>
            {language === "ta" ? "அனைத்தும்" : "View All"}
          </Text>
          <Ionicons name="arrow-forward" size={13} color="#003C28" />
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
            <Ionicons name="wallet-outline" size={22} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {language === "ta" ? "எனது திட்டங்கள்" : "My Schemes"}
          </Text>
        </TouchableOpacity>

        {/* 2. Quick Pay */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleQuickPay}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="flash-outline" size={22} color="#850111" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {language === "ta" ? "உடனடி தவணை" : "Quick Pay"}
          </Text>
        </TouchableOpacity>

        {/* 3. Receipts */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleReceipts}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="receipt-outline" size={22} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {language === "ta" ? "ரசீதுகள்" : "Receipts"}
          </Text>
        </TouchableOpacity>

        {/* 4. Gold Rate Chart */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleRateChart}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="trending-up-outline" size={22} color="#DAA520" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {language === "ta" ? "தங்க விலை" : "Gold Rate"}
          </Text>
        </TouchableOpacity>

        {/* 5. Our Stores */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleStores}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="location-outline" size={22} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            {language === "ta" ? "எங்கள் கிளைகள்" : "Our Stores"}
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
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewAllText: {
    fontSize: moderateScale(12.5),
    fontWeight: "700",
    color: "#003C28",
  },
  actionsRow: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10),
  },
  actionCard: {
    minWidth: moderateScale(96),
    height: moderateScale(72),
    borderRadius: moderateScale(14),
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  iconWrapper: {
    marginBottom: moderateScale(4),
  },
  actionText: {
    fontSize: moderateScale(10.5),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
});

export default QuickActionsV2;

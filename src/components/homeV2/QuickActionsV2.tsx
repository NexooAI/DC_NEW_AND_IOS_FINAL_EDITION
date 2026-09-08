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

interface QuickActionsV2Props {
  onMyChitsPress?: () => void;
  onReceiptsPress?: () => void;
  onStatementsPress?: () => void;
  onViewAllPress?: () => void;
}

export const QuickActionsV2: React.FC<QuickActionsV2Props> = ({
  onMyChitsPress,
  onReceiptsPress,
  onStatementsPress,
  onViewAllPress,
}) => {
  const router = useRouter();

  const handleMyChits = () => {
    if (onMyChitsPress) {
      onMyChitsPress();
    } else {
      router.push("/(app)/(tabs)/savings");
    }
  };

  const handleReceipts = () => {
    if (onReceiptsPress) {
      onReceiptsPress();
    } else {
      router.push("/(app)/payment-history");
    }
  };


  const handleStatements = () => {
    if (onStatementsPress) {
      onStatementsPress();
    } else {
      router.push("/(app)/payment-history");
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
        <Text style={styles.title}>Quick Actions</Text>
        <TouchableOpacity
          onPress={handleViewAll}
          activeOpacity={0.7}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={13} color="#003C28" />
        </TouchableOpacity>
      </View>

      {/* 5 Actions Horizontal Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}
      >
        {/* 1. My Chits */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleMyChits}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="people" size={22} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            My Chits
          </Text>
        </TouchableOpacity>

        {/* 2. Receipts */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleReceipts}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="receipt" size={22} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            Receipts
          </Text>
        </TouchableOpacity>

        {/* 3. Statements */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleStatements}
          activeOpacity={0.85}
        >
          <View style={styles.iconWrapper}>
            <MaterialCommunityIcons name="chart-pie" size={24} color="#003C28" />
          </View>
          <Text style={styles.actionText} numberOfLines={1}>
            Statements
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
    fontSize: moderateScale(10),
    fontWeight: "600",
    color: "#334155",
    textAlign: "center",
  },
});

export default QuickActionsV2;

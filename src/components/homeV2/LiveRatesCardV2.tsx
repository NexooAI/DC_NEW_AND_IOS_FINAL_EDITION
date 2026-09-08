import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";

interface LiveRatesCardV2Props {
  goldRate?: string | number;
  silverRate?: string | number;
  goldChange?: string | number;
  silverChange?: string | number;
  goldPurity?: string;
  onGoldPress?: () => void;
  onSilverPress?: () => void;
  onPress?: () => void;
}

export const LiveRatesCardV2: React.FC<LiveRatesCardV2Props> = ({
  goldRate = "6,485",
  silverRate = "78.50",
  goldChange = "+12",
  silverChange = "+0.50",
  goldPurity = "22K",
  onGoldPress,
  onSilverPress,
  onPress,
}) => {
  const router = useRouter();

  const handleGoldPress = () => {
    if (onGoldPress) {
      onGoldPress();
    } else if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/ratechart",
        params: { type: "gold" },
      });
    }
  };

  const handleSilverPress = () => {
    if (onSilverPress) {
      onSilverPress();
    } else if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/(app)/(tabs)/home/ratechart",
        params: { type: "silver" },
      });
    }
  };

  const formatRate = (val: string | number): string => {
    if (!val) return "0";
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return String(val);
    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  return (
    <View style={styles.container}>
      {/* Gold Rate Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handleGoldPress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFFDF8", "#FAF4E8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.topRow}>
            <Image
              source={require("../../../assets/images/gold.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.rateHeaderContainer}>
              <Text style={styles.rateType}>Gold Rate ({goldPurity})</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="caret-up" size={10} color="#16A34A" />
                <Text style={styles.changeText}>{goldChange}</Text>
                <Text style={styles.todayText}>Today</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.rateValue}>
              ₹ {formatRate(goldRate)}
              <Text style={styles.unitText}> / gm</Text>
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Silver Rate Card */}
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handleSilverPress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#F8FAFC", "#EDF2F7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.topRow}>
            <Image
              source={require("../../../assets/images/silver.png")}
              style={styles.icon}
              resizeMode="contain"
            />
            <View style={styles.rateHeaderContainer}>
              <Text style={styles.rateType}>Silver Rate</Text>
              <View style={styles.changeBadge}>
                <Ionicons name="caret-up" size={10} color="#16A34A" />
                <Text style={styles.changeText}>{silverChange}</Text>
                <Text style={styles.todayText}>Today</Text>
              </View>
            </View>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.rateValue}>
              ₹ {formatRate(silverRate)}
              <Text style={styles.unitText}> / gm</Text>
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(8),
    gap: moderateScale(10),
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: "space-between",
    minHeight: moderateScale(76),
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  icon: {
    width: moderateScale(34),
    height: moderateScale(34),
  },
  rateHeaderContainer: {
    flex: 1,
  },
  rateType: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#475569",
    marginBottom: 1,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  changeText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#16A34A",
  },
  todayText: {
    fontSize: moderateScale(9),
    fontWeight: "500",
    color: "#64748B",
    marginLeft: 2,
  },
  bottomRow: {
    marginTop: moderateScale(4),
  },
  rateValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  unitText: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#64748B",
  },
});

export default LiveRatesCardV2;

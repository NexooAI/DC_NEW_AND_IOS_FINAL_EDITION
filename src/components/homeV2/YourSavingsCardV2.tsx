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

interface YourSavingsCardV2Props {
  totalAmount?: number | string;
  totalGoldGrams?: number | string;
  onPress?: () => void;
}

export const YourSavingsCardV2: React.FC<YourSavingsCardV2Props> = ({
  totalAmount = 0,
  totalGoldGrams,
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(app)/(tabs)/savings");
    }
  };

  const formatCurrency = (val: number | string): string => {
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return String(val || "0");
    return num.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.cardWrapper}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFFDF8", "#F7EEDD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          {/* Left: 3D Piggy Bank / Coin Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require("../../../assets/images/savegold.png")}
              style={styles.icon}
              resizeMode="contain"
            />
          </View>

          {/* Middle: Title & Motivational Line */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Your Savings</Text>
            <Text style={styles.subtitle}>Small Steps, Big Tomorrow</Text>
          </View>

          {/* Vertical Divider */}
          <View style={styles.divider} />

          {/* Right: Total Value + Arrow */}
          <View style={styles.valueContainer}>
            <View>
              <Text style={styles.valueCaption}>Total Saved Value</Text>
              <Text style={styles.valueAmount}>
                ₹ {formatCurrency(totalAmount)}
              </Text>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons name="arrow-forward" size={14} color="#A16207" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
  },
  cardWrapper: {
    borderRadius: moderateScale(16),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: moderateScale(16),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  iconContainer: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
  },
  icon: {
    width: moderateScale(32),
    height: moderateScale(32),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: moderateScale(10),
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: moderateScale(32),
    backgroundColor: "rgba(212, 175, 55, 0.25)",
    marginHorizontal: moderateScale(10),
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
  },
  valueCaption: {
    fontSize: moderateScale(9),
    fontWeight: "600",
    color: "#64748B",
  },
  valueAmount: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#0F172A",
  },
  arrowCircle: {
    width: moderateScale(26),
    height: moderateScale(26),
    borderRadius: moderateScale(13),
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default YourSavingsCardV2;

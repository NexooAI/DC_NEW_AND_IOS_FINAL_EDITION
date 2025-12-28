import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { rf, wp, rp } = responsiveUtils;
const spacing = 16; // Approx spacing.lg

interface AnimatedGoldRateProps {
  goldRate: string;
  updatedAt?: string;
}

const AnimatedGoldRate: React.FC<AnimatedGoldRateProps> = ({
  goldRate,
  updatedAt,
}) => {
  const { t } = useTranslation();
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the live dot
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacityAnim, scaleAnim]);

  const formatDateToIndian = (isoString: string | undefined) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2e0406", "#4a0007"]} // Darker, sleeker background
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.bar}
      >
        {/* Left Side: Label */}
        <View style={styles.labelSection}>
            {/* <View style={styles.liveIndicator}>
                <Animated.View style={[styles.liveDot, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]} />
                <Text style={styles.liveText}>LIVE</Text>
            </View> */}
            <View style={styles.goldLabelContainer}>
                <Ionicons name="diamond-outline" size={14} color="#FFD700" style={{marginRight: 4}}/>
                <Text style={styles.goldLabel}>GOLD 22KT</Text>
            </View>
        </View>

        {/* Right Side: Price */}
        <View style={styles.priceSection}>
            <View style={styles.priceRow}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.priceValue}>{goldRate}</Text>
                <Text style={styles.unit}>/gm</Text>
            </View>
            {updatedAt && (
                <Text style={styles.updatedText}>
                  {formatDateToIndian(updatedAt)}
                </Text>
            )}
        </View>

        {/* Decorative Gold Line */}
        <View style={styles.accentLine} />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "auto", // Changed from 100% to auto to respect margins
    marginVertical: 10,
    marginHorizontal: rp(16), // Added horizontal margin
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
    overflow: "hidden",
    position: 'relative'
  },
  labelSection: {
      flex: 1,
      justifyContent: 'center'
  },
  liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4
  },
  liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FF4444',
      marginRight: 6
  },
  liveText: {
      color: '#FF4444',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5
  },
  goldLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  goldLabel: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
      letterSpacing: 1
  },
  priceSection: {
      alignItems: 'flex-end',
      justifyContent: 'center'
  },
  priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 2
  },
  currency: {
      color: theme.colors.secondary,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 2
  },
  priceValue: {
      color: "#FFFFFF",
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: 0.5
  },
  unit: {
      color: "rgba(255,255,255,0.6)",
      fontSize: 12,
      marginLeft: 2
  },
  updatedText: {
      color: "rgba(255,255,255,0.4)",
      fontSize: 10,
      fontStyle: 'italic'
  },
  accentLine: {
      position: 'absolute',
      bottom: 0,
      left: 20,
      right: 20,
      height: 1,
      backgroundColor: 'rgba(255,215,0,0.1)'
  }
});

export default AnimatedGoldRate;

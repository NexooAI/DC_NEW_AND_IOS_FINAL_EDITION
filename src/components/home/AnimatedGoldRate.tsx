import { useAppTheme } from "@/store/global.store";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { rf, wp, rp, hp } = responsiveUtils;

interface AnimatedGoldRateProps {
  goldRate: string;
  goldRate18?: string;
  goldRate14?: string;
  silverRate?: string;
  updatedAt?: string;
}

const AnimatedGoldRate: React.FC<AnimatedGoldRateProps> = ({
  goldRate,
  goldRate18,
  goldRate14,
  silverRate,
  updatedAt,
}) => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [showSilver, setShowSilver] = useState(false);

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

  const getRate = (rateVal: string | undefined, carat: number, isSilverRate = false) => {
    if (rateVal) {
      const sanitized = rateVal.replace(/,/g, "");
      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed).toString();
      }
    }
    if (isSilverRate) return "-";
    const parsedGold = parseFloat(goldRate.replace(/,/g, ""));
    if (isNaN(parsedGold) || parsedGold <= 0) return "-";
    const derived = Math.round(parsedGold * (carat / 22));
    return derived.toString();
  };

  const hasSilver = !!silverRate && silverRate.trim() !== "";

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#2e0406", "#4a0007"]} // Royal dark gold-red gradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bar}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.goldLabelContainer}>
            <Ionicons name="flame" size={16} color="#FFD700" style={{ marginRight: 6 }} />
            <Text style={styles.goldLabel}>
              {t("liveRates") || "LIVE RATES"}
            </Text>
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]} />
              <Text style={styles.liveText}>{t("live")?.toUpperCase() || "LIVE"}</Text>
            </View>
          </View>
          {updatedAt && (
            <Text style={styles.updatedText}>
              {formatDateToIndian(updatedAt)}
            </Text>
          )}
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Rates Grid - Showing both Gold & Silver rates together */}
        <View style={styles.ratesGrid}>
          {/* 22KT Gold Column */}
          <View style={styles.rateCol}>
            <Text style={styles.caratLabel}>22KT {t("gold")?.toUpperCase() || "GOLD"}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceValue}>{getRate(goldRate, 22)}</Text>
              <Text style={styles.unit}>/g</Text>
            </View>
          </View>

          <View style={styles.colDivider} />

          {/* 18KT Gold Column */}
          <View style={styles.rateCol}>
            <Text style={styles.caratLabel}>18KT {t("gold")?.toUpperCase() || "GOLD"}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceValue}>{getRate(goldRate18, 18)}</Text>
              <Text style={styles.unit}>/g</Text>
            </View>
          </View>

          <View style={styles.colDivider} />

          {/* Silver Column */}
          <View style={styles.rateCol}>
            <Text style={styles.caratLabel}>{t("silver")?.toUpperCase() || "SILVER"}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceValue}>{getRate(silverRate, 1, true)}</Text>
              <Text style={styles.unit}>/g</Text>
            </View>
          </View>
        </View>

        {/* Decorative Gold Bottom Highlight Line */}
        <View style={styles.accentLine} />
      </LinearGradient>
    </View>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    width: "auto",
    marginVertical: 10,
    marginHorizontal: rp(12),
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  bar: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.8),
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255, 215, 0, 0.25)",
    overflow: "hidden",
    position: "relative",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.2),
  },
  goldLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  goldLabel: {
    color: "#FFFFFF",
    fontSize: rf(12),
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FF4444",
    marginRight: 4,
  },
  liveText: {
    color: "#FF4444",
    fontSize: rf(8),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  updatedText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: rf(8.5),
    fontStyle: "italic",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    marginVertical: hp(0.5),
    marginBottom: hp(1.2),
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 3,
    marginBottom: hp(1.2),
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: hp(0.8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#FFD700',
  },
  toggleText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: rf(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  ratesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rateCol: {
    flex: 1,
    alignItems: "center",
  },
  caratLabel: {
    color: "#DAA520",
    fontSize: rf(11),
    fontWeight: "800",
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    color: "rgba(255,255,255,0.7)",
    fontSize: rf(11),
    fontWeight: "600",
    marginRight: 1,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: rf(16),
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  unit: {
    color: "rgba(255,255,255,0.5)",
    fontSize: rf(9),
    marginLeft: 1,
  },
  colDivider: {
    width: 1.5,
    height: hp(3.5),
    backgroundColor: "rgba(255, 215, 0, 0.15)",
  },
  accentLine: {
    position: "absolute",
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: "rgba(255,215,0,0.1)",
  },
}) }

var styles = getStyles(theme);;

export default AnimatedGoldRate;

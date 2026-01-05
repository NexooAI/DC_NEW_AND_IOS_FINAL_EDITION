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
  silverRate?: string;
  updatedAt?: string;
}

const AnimatedGoldRate: React.FC<AnimatedGoldRateProps> = ({
  goldRate,
  silverRate,
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
        <View style={styles.contentContainer}>
          {/* Main Row: Gold | Silver */}
          <View style={styles.mainRow}>
            {/* Gold Section (Left) */}
            <View style={[styles.rateSection, { width: silverRate ? '50%' : '100%' }]}>
              <View style={styles.labelContainer}>
                <Ionicons name="diamond-outline" size={12} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={styles.goldLabel}>{t('gold_22kt')}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.currency}>₹</Text>
                <Text style={styles.priceValue}>{goldRate}</Text>
                <Text style={styles.unit}>{t('per_gram')}</Text>
              </View>
            </View>

            {/* Vertical Divider - Absolute Positioned */}
            {silverRate && <View style={styles.verticalDivider} />}

            {/* Silver Section (Right) */}
            {silverRate && (
              <View style={[styles.rateSection, { width: '50%' }]}>
                <View style={styles.labelContainer}>
                  <Ionicons name="hardware-chip-outline" size={12} color="#C0C0C0" style={{ marginRight: 4 }} />
                  <Text style={[styles.goldLabel, { color: "#E0E0E0" }]}>{t('silver_999')}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.currency, { color: "#C0C0C0" }]}>₹</Text>
                  <Text style={[styles.priceValue, { color: "#FFFFFF" }]}>{silverRate}</Text>
                  <Text style={styles.unit}>{t('per_gram')}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer Time */}
          {updatedAt && (
            <View style={styles.footerContainer}>
              <View style={styles.liveIndicator}>
                <Animated.View style={[styles.liveDot, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]} />
                <Text style={styles.liveText}>{t('last_update_label').toUpperCase()}</Text>
              </View>
              <Text style={styles.updatedText}>
                {t('last_updated')}: {formatDateToIndian(updatedAt)}
              </Text>
            </View>
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
    width: "auto",
    marginVertical: 10,
    marginHorizontal: rp(16),
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)",
    overflow: "hidden",
    position: 'relative',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  contentContainer: {
    gap: 5,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', // Context for absolute divider
    width: '100%',
  },
  rateSection: {
    // flex: 1, // Removed flex to use explicit width
    alignItems: 'center', // Centered content looks best for even split
    justifyContent: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%', // Full height of the row
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    position: 'absolute',
    left: '50%', // Exact middle
    marginLeft: -0.5, // Center the pixel
    zIndex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goldLabel: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    color: theme.colors.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  priceValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  unit: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    marginLeft: 2,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF4444',
    marginRight: 6,
  },
  liveText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  updatedText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '500'
  },
  accentLine: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
});

export default AnimatedGoldRate;

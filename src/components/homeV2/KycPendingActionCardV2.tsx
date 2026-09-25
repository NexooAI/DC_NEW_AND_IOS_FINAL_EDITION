import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";

export interface KycPendingActionCardV2Props {
  onPress?: () => void;
  title?: string;
  description?: string;
}

export const KycPendingActionCardV2: React.FC<KycPendingActionCardV2Props> = ({
  onPress,
  title,
  description,
}) => {
  const router = useRouter();
  const { t } = useTranslation();

  // Blinking / Pulsing animation for Pending Action beacon
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [blinkAnim]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(app)/(tabs)/home/kyc");
    }
  };

  const displayTitle = title || t("kycPendingTitle") || "KYC Verification Pending";
  const displayDescription =
    description ||
    t("kycPendingDesc") ||
    "Complete your KYC verification to secure your digital gold savings and enjoy instant transactions.";

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={["#FFF5F5", "#FEF2F2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Top Row: Blinking Beacon Badge & Action CTA */}
          <View style={styles.topRow}>
            <View style={styles.badgeContainer}>
              <View style={styles.beaconWrapper}>
                <Animated.View
                  style={[
                    styles.beaconHalo,
                    {
                      opacity: blinkAnim.interpolate({
                        inputRange: [0.2, 1],
                        outputRange: [0.6, 0],
                      }),
                      transform: [
                        {
                          scale: blinkAnim.interpolate({
                            inputRange: [0.2, 1],
                            outputRange: [1, 2.3],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.beaconDot,
                    {
                      opacity: blinkAnim,
                    },
                  ]}
                />
              </View>
              <Text style={styles.badgeText}>PENDING ACTION</Text>
            </View>

            <View style={styles.verifyPill}>
              <Text style={styles.verifyPillText}>Complete Now</Text>
              <Ionicons name="arrow-forward" size={moderateScale(11)} color="#DC2626" />
            </View>
          </View>

          {/* Main Content: Alert Avatar + Title & Subtitle */}
          <View style={styles.contentRow}>
            <View style={styles.iconCircle}>
              <Ionicons
                name="shield-alert"
                size={moderateScale(22)}
                color="#DC2626"
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.titleText}>{displayTitle}</Text>
              <Text style={styles.descText} numberOfLines={2}>
                {displayDescription}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: moderateScale(14),
    paddingTop: moderateScale(6),
    paddingBottom: moderateScale(4),
  },
  cardTouchable: {
    borderRadius: moderateScale(14),
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.22)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(8),
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    paddingHorizontal: moderateScale(7),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
    gap: 6,
  },
  beaconWrapper: {
    width: moderateScale(8),
    height: moderateScale(8),
    alignItems: "center",
    justifyContent: "center",
  },
  beaconHalo: {
    position: "absolute",
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#DC2626",
  },
  beaconDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(3.5),
    backgroundColor: "#DC2626",
  },
  badgeText: {
    color: "#DC2626",
    fontSize: moderateScale(9),
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  verifyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: moderateScale(8),
    paddingVertical: moderateScale(3),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(220, 38, 38, 0.25)",
  },
  verifyPillText: {
    color: "#DC2626",
    fontSize: moderateScale(10),
    fontWeight: "700",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(10),
  },
  iconCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "rgba(220, 38, 38, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  descText: {
    fontSize: moderateScale(11),
    color: "#64748B",
    lineHeight: moderateScale(15),
  },
});

export default KycPendingActionCardV2;

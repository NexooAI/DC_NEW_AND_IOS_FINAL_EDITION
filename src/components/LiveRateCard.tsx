import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

import { logger } from "@/utils/logger";
interface LiveRateCardProps {
  type: string;
  rate: string | number;
  lastupdated: string;
  image: ImageSourcePropType;
  onPress?: () => void;
  isSingle?: boolean;
}

const LiveRateCard = ({
  type,
  rate,
  lastupdated,
  image,
  onPress,
  isSingle,
}: LiveRateCardProps) => {
  const router = useRouter();
  const {
    screenWidth,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
  } = useResponsiveLayout();

  // Create styles with responsive values
  const dynamicStyles = StyleSheet.create({
    cardContainer: {
      backgroundColor: "white",
      borderRadius: 15,
      width: screenWidth * 0.42,
      maxWidth: 200,
      alignItems: "center",
      paddingTop: 30,
      paddingBottom: 10,
      marginBottom: 20,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 5,
      overflow: "visible",
      zIndex: 1,
    },
    singleCardContainer: {
      width: screenWidth * 0.8,
      maxWidth: deviceScale(300),
      paddingTop: deviceScale(40),
      paddingBottom: deviceScale(20),
      zIndex: 1,
    },
    image: {
      width: deviceScale(65),
      height: deviceScale(65),
      borderRadius: deviceScale(10),
    },
    singleImage: {
      width: deviceScale(100),
      height: deviceScale(120),
    },
    singleCardContent: {
      paddingTop: deviceScale(20),
    },
    liveDot: {
      width: deviceScale(8),
      height: deviceScale(8),
      borderRadius: deviceScale(4),
      backgroundColor: theme.colors.success,
    },
    liveText: {
      fontSize: getResponsiveFontSize(8, 10, 12),
      color: theme.colors.success,
      fontWeight: "bold",
    },
    type: {
      fontSize: getResponsiveFontSize(12, 14, 16),
      color: theme.colors.textMediumGrey,
      fontWeight: "bold",
    },
    singleType: {
      fontSize: getResponsiveFontSize(16, 18, 20),
    },
    rate: {
      fontSize: getResponsiveFontSize(18, 22, 26),
      fontWeight: "bold",
      color: theme.colors.warning,
    },
    singleRate: {
      fontSize: getResponsiveFontSize(28, 32, 36),
      marginTop: deviceScale(10),
    },
    lastUpdated: {
      fontSize: getResponsiveFontSize(8, 10, 12),
      color: theme.colors.textLightGrey,
    },
    singleLastUpdated: {
      fontSize: getResponsiveFontSize(10, 12, 14),
      marginTop: deviceScale(5),
    },
  });

  const handlePress = () => {
    try {
      if (onPress) {
        onPress();
      } else {
        const formattedType = type?.toString().trim() || "Gold";
        // router.push({
        //   pathname: "/(app)/(tabs)/home/live-rates",
        //   params: { type: formattedType }
        // });
      }
    } catch (error) {
      logger.error("Navigation error:", error);
      // router.push("/(app)/(tabs)/home/live-rates");
    }
  };

  const isGold = type.toLowerCase() === "gold";
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rateAnim = useRef(new Animated.Value(0)).current;
  const liveDotAnim = useRef(new Animated.Value(0)).current;

  // Glow animation
  useEffect(() => {
    const glow = Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(glow).start();
  }, []);

  // Rate number animation
  useEffect(() => {
    Animated.spring(rateAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [rate]);

  // Live dot animation
  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(liveDotAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(liveDotAnim, {
        toValue: 0,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, []);

  const glowStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0.8],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 20],
    }),
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View
        style={[
          dynamicStyles.cardContainer,
          isGold ? styles.goldGlow : styles.silverGlow,
          glowStyle,
          isSingle && dynamicStyles.singleCardContainer,
        ]}
      >
        <View
          style={[
            styles.imageContainer,
            isSingle && styles.singleImageContainer,
          ]}
        >
          <Image
            source={image}
            style={[dynamicStyles.image, isSingle && dynamicStyles.singleImage]}
            resizeMode="contain"
          />
        </View>

        <View
          style={[
            styles.cardContent,
            isSingle && dynamicStyles.singleCardContent,
          ]}
        >
          <View style={styles.typeContainer}>
            <Text
              style={[dynamicStyles.type, isSingle && dynamicStyles.singleType]}
            >
              {type}
            </Text>
            <View>
              <Text style={dynamicStyles.liveText}>
                {type === "Gold" ? "22KT" : ""}
              </Text>
            </View>
            {/* <View style={styles.liveIndicator}>
              <Animated.View
                style={[
                  dynamicStyles.liveDot,
                  {
                    opacity: liveDotAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 1],
                    }),
                    transform: [
                      {
                        scale: liveDotAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text style={dynamicStyles.liveText}>LIVE</Text>
            </View> */}
          </View>
          <Animated.Text
            style={[
              dynamicStyles.rate,
              isSingle && dynamicStyles.singleRate,
              {
                transform: [
                  { scale: rateAnim },
                  {
                    translateY: rateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
                opacity: rateAnim,
              },
            ]}
          >
            ₹{rate}
          </Animated.Text>
          <Text
            style={[
              dynamicStyles.lastUpdated,
              isSingle && dynamicStyles.singleLastUpdated,
            ]}
          >
            {lastupdated}
          </Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  goldGlow: {
    shadowColor: theme.colors.gold,
    borderWidth: 2,
    borderColor: theme.colors.gold,
  },
  silverGlow: {
    shadowColor: theme.colors.silver,
    borderWidth: 2,
    borderColor: theme.colors.silver,
  },
  imageContainer: {
    position: "absolute",
    top: "-60%",
    left: "50%",
    transform: [{ translateX: -50 }],
    zIndex: 1,
  },
  singleImageContainer: {
    top: "-80%",
    zIndex: 1,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});

export default LiveRateCard;

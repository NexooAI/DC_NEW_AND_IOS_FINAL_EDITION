import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Animated,
  ImageBackground,
  Platform,
} from "react-native";
import { router, useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

interface Scheme {
  SCHEMEID: number;
  SCHEMENAME: string | { en: string; ta: string };
  SCHEMETYPE: string;
  DESCRIPTION: string | { en: string; ta: string };
  SLOGAN: string;
  IMAGE: string;
  ICON: string;
  chits: Array<any>;
}

interface CardProps {
  item: Scheme;
  index: number;
}

// Using responsive layout hook instead of direct Dimensions
const BANNER_HEIGHT = 40;

const CardComponent = ({ item, index }: CardProps) => {
  const { t } = useTranslation();
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight,
  } = useResponsiveLayout();

  // Helper to extract text from multilingual objects
  const getLocalizedText = (textObj: any) => {
    if (!textObj) return "";

    // Handle strings
    if (typeof textObj === "string") return textObj;

    // Handle numbers
    if (typeof textObj === "number") return textObj.toString();

    // Handle objects with en/ta keys
    if (typeof textObj === "object" && textObj !== null) {
      if ("en" in textObj || "ta" in textObj) {
        return textObj.en || textObj.ta || "";
      }

      // Handle arrays
      if (Array.isArray(textObj)) {
        return textObj.join(", ");
      }

      // Handle other objects - convert to string safely
      try {
        return JSON.stringify(textObj);
      } catch {
        return "[Object]";
      }
    }

    // Fallback for any other type
    return String(textObj);
  };
  const router = useRouter();
  const [fallback, setFallback] = useState(false);
  const [bannerFallback, setBannerFallback] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Calculate responsive card width
  const cardWidth = screenWidth * 0.75;

  // Animation for card press
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setPressed(true);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    setPressed(false);
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "2deg"],
  });

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          transform: [{ scale: scaleAnim }, { rotate }],
        },
        styles.cardContainer,
      ]}
      className="mr-4"
    >
      <ImageBackground
        source={require("../../assets/images/scheme_card_bg.png")}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <BlurView intensity={25} tint="dark" style={styles.blurOverlay}>
          <LinearGradient
            colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.8)"]}
            locations={[0, 0.5, 1]}
            style={styles.contentOverlay}
          >
            <View style={styles.cardContent}>
              <View style={styles.headerSection}>
                <View style={styles.schemeTypeTag}>
                  <Text style={styles.schemeTypeText}>{item.SCHEMETYPE}</Text>
                </View>
                <Text style={styles.schemeName}>
                  {getLocalizedText(item.SCHEMENAME)}
                </Text>
                <Text style={styles.slogan}>{item.SLOGAN}</Text>
              </View>

              <View style={styles.descriptionSection}>
                <Text style={styles.description} numberOfLines={2}>
                  {getLocalizedText(item.DESCRIPTION)}
                </Text>
              </View>

              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={styles.knowMoreButton}
                  onPress={() =>
                    router.push({
                      pathname: "/home/productsdetails",
                      params: { schemeId: item.SCHEMEID },
                    })
                  }
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.knowMoreText}>{t("knowMore")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() =>
                    router.push({
                      pathname: "/home/join_savings",
                      params: {
                        schemeId: item.SCHEMEID,
                        schemeData: JSON.stringify({
                          name: getLocalizedText(item.SCHEMENAME),
                          description: getLocalizedText(item.DESCRIPTION),
                          type: item.SCHEMETYPE,
                          chit: item.chits,
                        }),
                      },
                    })
                  }
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                >
                  <Ionicons name="cash-outline" size={18} color="#fff" />
                  <Text style={styles.joinText}>{t("joinNow")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </ImageBackground>
    </Animated.View>
  );
};

interface InvestmentCardsProps {
  schemes: { data: Scheme[] } | null;
}

const InvestmentCards = React.memo(({ schemes }: InvestmentCardsProps) => {
  const { t } = useTranslation();
  const {
    screenWidth,
    screenHeight,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    spacing,
    fontSize,
    padding,
    getCardWidth,
    getGridColumns,
    getListItemHeight,
  } = useResponsiveLayout();
  const { language } = useGlobalStore();

  // Calculate responsive card width
  const cardWidth = screenWidth * 0.75;

  if (!schemes?.data?.length) {
    return (
      <View className="p-4">
        <Text className="text-gray-500 text-center">No schemes available</Text>
      </View>
    );
  }

  // Memoized renderItem for FlatList with proper typing
  const renderCardItem = useCallback(
    ({ item, index }: { item: Scheme; index: number }) => (
      <CardComponent item={item} index={index} />
    ),
    []
  );

  return (
    <View className="flex-1 bg-white" style={{ margin: 0 }}>
      <FlatList
        data={schemes.data}
        horizontal
        keyExtractor={(item) => item.SCHEMEID.toString()}
        renderItem={renderCardItem}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 24,
        }}
        snapToInterval={cardWidth + 16}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={5}
      />
    </View>
  );
});

InvestmentCards.displayName = "InvestmentCards";

const styles = StyleSheet.create({
  cardContainer: {
    elevation: 15,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    backgroundColor: "transparent",
    borderRadius: 24,
    overflow: "hidden",
  },
  backgroundImage: {
    width: "100%",
    height: 260,
  },
  backgroundImageStyle: {
    borderRadius: 24,
    transform: [{ scale: 1.1 }],
  },
  blurOverlay: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  contentOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  cardContent: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerSection: {
    alignItems: "flex-start",
  },
  schemeTypeTag: {
    backgroundColor: "rgba(133,1,17,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  schemeTypeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: -0.5,
  },
  slogan: {
    fontSize: 12,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  descriptionSection: {
    marginVertical: 16,
  },
  description: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  knowMoreButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  knowMoreText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  joinButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#850111",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#850111",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

export default InvestmentCards;

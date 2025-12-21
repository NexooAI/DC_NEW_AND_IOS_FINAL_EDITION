import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { moderateScale } from "react-native-size-matters";
import { COLORS } from "@/constants/colors";
import { logger } from "@/utils/logger";

// Import hallmark images
const hallmark1Image = require("../../assets/images/halmark1.jpg");
const hallmark2Image = require("../../assets/images/halmark2.jpg");

interface HallmarkSliderProps {
  // Add any props if needed in the future
}

const HallmarkSlider: React.FC<HallmarkSliderProps> = () => {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = screenWidth * 0.8; // 80% of screen width for each item
  const totalItems = 1; // Number of hallmark images

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % totalItems;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * itemWidth,
          animated: true,
        });
        return nextIndex;
      });
    }, 2000); // 2 seconds delay

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.hallmarkContainer}>
      <View style={styles.hallmarkHeader}>
        <View style={styles.hallmarkHeaderLine} />
        <Text style={styles.hallmarkHeaderText}>{t("certifiedHallmark")}</Text>
        <View style={styles.hallmarkHeaderLine} />
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hallmarkImagesContainer}
        decelerationRate={0.998}
        snapToInterval={itemWidth}
        snapToAlignment="center"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / itemWidth
          );
          setCurrentIndex(index);
        }}
      >
        <View style={styles.hallmarkImageWrapper}>
          <Image
            source={hallmark1Image}
            style={styles.hallmarkImage}
            resizeMode="contain"
            onError={(error) => {
              logger.error("Hallmark image loading error:", error);
            }}
            onLoad={() => {
              logger.log("Hallmark image loaded successfully");
            }}
          />
          <Text style={styles.hallmarkImageLabel}>{t("goldHallmarking")}</Text>
        </View>
        {/* <View style={styles.hallmarkImageWrapper}>
          <Image
            source={hallmark2Image}
            style={styles.hallmarkImage}
            resizeMode="contain"
          />
          <Text style={styles.hallmarkImageLabel}>
            {t("certifiedDiamonds")}
          </Text>
        </View> */}
      </ScrollView>

      {/* Dots indicator */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalItems }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hallmarkContainer: {
    width: "100%",
    paddingHorizontal: 10,
    marginTop: 15,
    marginBottom: 10,
  },
  hallmarkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 5,
  },
  hallmarkHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.gold,
    marginHorizontal: 5,
  },
  hallmarkHeaderText: {
    fontSize: moderateScale(16),
    fontWeight: "700",
    color: COLORS.error,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  hallmarkImagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    // paddingVertical: 10,
  },
  hallmarkImageWrapper: {
    alignItems: "center",
    width: Dimensions.get("window").width * 0.8,
    marginHorizontal: 10,
    // paddingHorizontal: 10,
  },
  hallmarkImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  hallmarkImageLabel: {
    fontSize: moderateScale(10),
    color: COLORS.mediumGrey,
    textAlign: "center",
    fontStyle: "italic",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.gold,
  },
  inactiveDot: {
    backgroundColor: COLORS.mediumGrey,
    opacity: 0.3,
  },
});

export default HallmarkSlider;

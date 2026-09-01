import { theme } from "@/constants/theme";
import { useAppTheme } from "@/store/global.store";
import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { logger } from "@/utils/logger";

interface PostersSliderProps {
  images: Array<{
    id: string | number;
    image: string | number | { uri: string };
    title?: string;
  }>;
}

const PosterCard: React.FC<{
  item: any;
  index: number;
  itemWidth: number;
  itemHeight: number;
  itemGap: number;
  theme: any;
}> = ({ item, index, itemWidth, itemHeight, itemGap, theme }) => {
  const [loading, setLoading] = useState(true);

  return (
    <View
      key={item.id || index}
      style={[
        styles.card,
        {
          width: itemWidth,
          height: itemHeight,
          marginHorizontal: itemGap / 2,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f3f4f6",
        },
      ]}
    >
      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1,
            },
          ]}
        >
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      )}
      <Image
        source={
          typeof item.image === "string"
            ? { uri: item.image }
            : item.image
        }
        style={styles.image}
        resizeMode="stretch"
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(error) => {
          setLoading(false);
          logger.error("Poster image loading error:", error);
        }}
      />
    </View>
  );
};

const PostersSlider: React.FC<PostersSliderProps> = ({ images = [] }) => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { screenWidth, isTablet } = useResponsiveLayout();

  const sliderWidth = isTablet ? 600 : screenWidth;
  const itemWidth = isTablet ? 560 : screenWidth * 0.9;
  const itemHeight = itemWidth / 2.04;
  const itemGap = 12;

  const totalItems = images.length;

  // Auto-scroll effect
  useEffect(() => {
    if (totalItems <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % totalItems;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (itemWidth + itemGap),
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // 4 seconds delay

    return () => clearInterval(interval);
  }, [totalItems, itemWidth]);

  if (totalItems === 0) return null;

  return (
    <View style={[styles.container, { width: sliderWidth }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: (sliderWidth - itemWidth) / 2 },
        ]}
        decelerationRate="fast"
        snapToInterval={itemWidth + itemGap}
        snapToAlignment="center"
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (itemWidth + itemGap)
          );
          setCurrentIndex(Math.min(Math.max(0, index), totalItems - 1));
        }}
      >
        {images.map((item, index) => (
          <PosterCard
            key={item.id || index}
            item={item}
            index={index}
            itemWidth={itemWidth}
            itemHeight={itemHeight}
            itemGap={itemGap}
            theme={theme}
          />
        ))}
      </ScrollView>

      {/* Dots indicator */}
      {totalItems > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
                currentIndex === index && { width: 16 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    alignSelf: "center",
    marginVertical: 12,
  },
  scrollContent: {
    alignItems: "center",
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.15)", // Subtle gold border
  },
  image: {
    width: "100%",
    height: "100%",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: COLORS.gold,
  },
  inactiveDot: {
    backgroundColor: COLORS.mediumGrey,
    opacity: 0.3,
  },
}) }

var styles = getStyles(theme);;

export default PostersSlider;

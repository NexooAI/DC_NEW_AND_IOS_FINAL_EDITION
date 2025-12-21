import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  FlatList,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import api from "@/services/api";

import { logger } from '@/utils/logger';
// Import images directly - correct path: src/app/intro.tsx -> assets/images/ (2 levels up)
const intro1 = require("../../assets/images/intro_1.png");
const intro2 = require("../../assets/images/intro_2.png");
const intro3 = require("../../assets/images/intro_3.png");

// Static data - will be replaced with API data
const staticSlides = [
  {
    id: "1",
    image: intro1,
  },
  {
    id: "2",
    image: intro2,
  },
  {
    id: "3",
    image: intro3,
  },
];

// Helper function to get image source
const getImageSource = (imagePath: string) => {
  if (!imagePath) return null;

  // If image path starts with http, use it directly
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return { uri: imagePath };
  }

  // If image path starts with /uploads/, prepend base URL
  if (imagePath.startsWith('/uploads/')) {
    return { uri: `${theme.baseUrl}${imagePath}` };
  }

  // Otherwise, assume it's a local require
  return imagePath;
};

export default function Intro() {
  const { t } = useTranslation();
  const { markAsLaunched } = useFirstLaunch();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [slides, setSlides] = useState(staticSlides);
  const [isLoading, setIsLoading] = useState(true);
  const { language } = useGlobalStore(); // To re-render on language change
  const { screenWidth, screenHeight } = useResponsiveLayout();

  // Fetch intro slides from API
  useEffect(() => {
    const fetchIntroSlides = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/intro-screens/active');

        if (response.data?.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          // Transform API response to slides format
          const apiSlides = response.data.data.map((item: any, index: number) => ({
            id: String(item.id || index),
            image: getImageSource(item.image),
            title: item.title || '',
          }));

          logger.log('Fetched intro slides from API:', apiSlides);
          setSlides(apiSlides);
        } else {
          // API returned empty array or no data, use default images
          logger.log('API returned empty data, using default static slides');
          setSlides(staticSlides);
        }
      } catch (error) {
        logger.error('Error fetching intro slides:', error);
        // On error, fallback to default images
        setSlides(staticSlides);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIntroSlides();
  }, []);

  const handleGetStarted = async () => {
    await markAsLaunched();
    router.replace("/login");
  };

  const renderSlide = ({ item }: { item: any }) => {
    if (!item.image) {
      logger.warn("Slide has no image:", item.id);
      return null;
    }

    logger.log("Rendering slide:", item.id, "Image source:", item.image);

    return (
      <View style={[styles.slide, { width: screenWidth }]}>
        <ImageBackground
          source={item.image}
          style={styles.backgroundImage}
          resizeMode="cover"
          onError={(error) => {
            logger.error("Image loading error for slide", item.id, ":", error);
          }}
        >
          <LinearGradient
            colors={[
              theme.colors.bgImageOverlayMedium,
              theme.colors.bgImageOverlay,
            ]}
            style={styles.overlay}
          />
        </ImageBackground>
      </View>
    );
  };

  const Footer = () => {
    return (
      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, index) => {
            const inputRange = [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ];

            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 20, 8],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.indicator,
                  {
                    width: dotWidth,
                    opacity,
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={styles.buttonContainer}>
          {currentSlideIndex !== slides.length - 1 ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                const nextIndex = currentSlideIndex + 1;
                if (nextIndex < slides.length && flatListRef.current) {
                  try {
                    flatListRef.current.scrollToIndex({
                      index: nextIndex,
                      animated: true,
                    });
                  } catch (error) {
                    logger.error("Error scrolling to next slide:", error);
                    // Fallback: scroll by offset
                    flatListRef.current.scrollToOffset({
                      offset: nextIndex * screenWidth,
                      animated: true,
                    });
                  }
                }
              }}
            >
              <Text style={styles.buttonText}>{t("next")}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.getStartedButton]}
              onPress={handleGetStarted}
            >
              <Text style={styles.buttonText}>{t("get_started")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth
          );
          setCurrentSlideIndex(index);
        }}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    height: "100%",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    marginHorizontal: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    shadowColor: theme.colors.shadowBlack,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  getStartedButton: {
    backgroundColor: theme.colors.redDark,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
});

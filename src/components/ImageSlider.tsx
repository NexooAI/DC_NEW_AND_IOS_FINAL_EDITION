import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  FlatList,
} from "react-native";
import { Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { logger } from "@/utils/logger";

// Using responsive layout hook instead of direct Dimensions

const ITEM_HEIGHT = 200;
// const CONTAINER_WIDTH = SCREEN_WIDTH * 0.95;

interface ImageSliderProps {
  images: Array<{
    id: string | number;
    image: string | number | { uri: string };
  }>;
}

const ImageSlider = React.memo(
  ({ images = [] }: ImageSliderProps): React.ReactElement => {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef<FlatList>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const currentIndexRef = useRef(0);

    // Get responsive layout values at component level
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

    // Calculate responsive container width
    const containerWidth = screenWidth * 0.95;

    useEffect(() => {
      startAutoPlay();
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }, [images]);

    const startAutoPlay = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (images.length <= 1) return;

      timerRef.current = setInterval(() => {
        const nextIndex = (currentIndexRef.current + 1) % images.length;
        currentIndexRef.current = nextIndex;
        setActiveIndex(nextIndex);
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }, 5000);
    };

    const renderItem = ({ item, index }: { item: any; index: number }) => {
      const inputRange = [
        (index - 1) * containerWidth,
        index * containerWidth,
        (index + 1) * containerWidth,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.9, 1, 0.9],
        extrapolate: "clamp",
      });

      return (
        <Animated.View
          style={[
            styles.itemContainer,
            {
              transform: [{ scale }],
              width: containerWidth,
              height: ITEM_HEIGHT,
              maxWidth: containerWidth,
              maxHeight: ITEM_HEIGHT,
            },
          ]}
        >
          <View style={styles.imageWrapper}>
            <Image
              source={
                typeof item.image === "string"
                  ? { uri: item.image }
                  : item.image
              }
              style={[
                styles.image,
                {
                  width: containerWidth,
                  height: ITEM_HEIGHT,
                  maxWidth: containerWidth,
                  maxHeight: ITEM_HEIGHT,
                },
              ]}
              resizeMode="contain"
              onError={(error) => {
                logger.error("Image load error:", error);
              }}
            />
          </View>
        </Animated.View>
      );
    };

    const handlePrev = () => {
      if (images.length === 0) return;
      const newIndex =
        (currentIndexRef.current - 1 + images.length) % images.length;
      currentIndexRef.current = newIndex;
      setActiveIndex(newIndex);
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
      startAutoPlay();
    };

    const handleNext = () => {
      if (images.length === 0) return;
      const newIndex = (currentIndexRef.current + 1) % images.length;
      currentIndexRef.current = newIndex;
      setActiveIndex(newIndex);
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
      });
      startAutoPlay();
    };

    return (
      <View style={styles.container}>
        <Animated.FlatList
          ref={flatListRef}
          data={images}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          getItemLayout={(_, index) => ({
            length: containerWidth,
            offset: containerWidth * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / containerWidth
            );
            currentIndexRef.current = newIndex;
            setActiveIndex(newIndex);
          }}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          snapToInterval={containerWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{
            alignItems: "center",
          }}
        />

        {images.length > 1 && (
          <>
            <TouchableOpacity style={styles.prevButton} onPress={handlePrev}>
              <MaterialIcons
                name="chevron-left"
                size={20}
                color={theme.colors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <MaterialIcons
                name="chevron-right"
                size={20}
                color={theme.colors.white}
              />
            </TouchableOpacity>
          </>
        )}

        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: index === activeIndex ? 20 : 8,
                    backgroundColor:
                      index === activeIndex
                        ? theme.colors.primary
                        : theme.colors.gold,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  }
);

ImageSlider.displayName = "ImageSlider";

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT,
    // backgroundColor: theme.colors.black,
    // borderRadius: 12,
    // overflow: "hidden",
    marginVertical: 10,
    width: "95%",
    alignSelf: "center",
    position: "relative",
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    width: "100%",
    overflow: "hidden",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: theme.colors.black,
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    // overflow: "hidden",
    borderRadius: 12,
    position: "absolute",
    top: 0,
    left: 0,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  pagination: {
    flexDirection: "row",
    // position: "absolute",
    // bottom: 20,
    alignSelf: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  prevButton: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
  nextButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 5,
  },
});

export default ImageSlider;

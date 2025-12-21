import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

import { logger } from "@/utils/logger";
interface StatusViewProps {
  collections: any[];
  isVisible: boolean;
  initialCollectionIndex: number;
  onClose: () => void;
}

const STATUS_DURATION = 10000; // 10 seconds per status

const StatusView: React.FC<StatusViewProps> = React.memo(
  ({ collections, isVisible, initialCollectionIndex, onClose }) => {
    const [currentCollection, setCurrentCollection] = useState(
      collections[initialCollectionIndex]
    );
    const [currentCollectionIndex, setCurrentCollectionIndex] = useState(
      initialCollectionIndex
    );
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const touchStartX = useRef(0);
    const touchStartTime = useRef(0);
    const [viewedStatus, setViewedStatus] = useState<boolean[]>([]);

    // Get safe area insets
    const insets = useSafeAreaInsets();

    // Get responsive layout values
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

    // Create dynamic styles with responsive values
    const dynamicStyles = StyleSheet.create({
      statusImage: {
        width: "100%",
        height: "100%",
      },
      navButton: {
        width: "20%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
      },
    });

    // Reset and start animation when visibility, collections, or index changes
    useEffect(() => {
      if (
        isVisible &&
        collections.length > 0 &&
        initialCollectionIndex >= 0 &&
        initialCollectionIndex < collections.length
      ) {
        setCurrentCollection(collections[initialCollectionIndex]);
        setCurrentCollectionIndex(initialCollectionIndex);
        setCurrentImageIndex(0);
        setIsPaused(false);
        setImageLoading(true);
        // Initialize viewedStatus: first image is true, rest are false
        const images = collections[initialCollectionIndex]?.status_images || [];
        setViewedStatus(images.map((_: any, idx: number) => idx === 0));
        startProgressAnimation();
      }
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [isVisible, collections, initialCollectionIndex]);

    // Mark status as viewed when currentImageIndex changes
    useEffect(() => {
      if (isVisible && currentCollection?.status_images) {
        setViewedStatus((prev) => {
          if (!prev.length) return [];
          if (prev[currentImageIndex]) return prev; // already viewed
          const updated = [...prev];
          updated[currentImageIndex] = true;
          return updated;
        });
      }
    }, [currentImageIndex, isVisible, currentCollection]);

    // Handle image progression
    useEffect(() => {
      if (isVisible && !isPaused) {
        setImageLoading(true);
        startProgressAnimation();
      }
    }, [currentImageIndex, currentCollectionIndex, isPaused]);

    const startProgressAnimation = () => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Reset progress animation
      progressAnim.setValue(0);

      if (!isPaused) {
        // Start progress animation
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: STATUS_DURATION,
          useNativeDriver: false,
        }).start();

        // Set timer to move to next image/collection
        timerRef.current = setTimeout(() => {
          handleNext();
        }, STATUS_DURATION);
      }
    };

    const handleNext = () => {
      const currentImages = currentCollection?.status_images || [];

      if (currentImageIndex < currentImages.length - 1) {
        // Move to next image in current collection
        setCurrentImageIndex((prev) => prev + 1);
      } else if (currentCollectionIndex < collections.length - 1) {
        // Move to next collection
        const nextCollectionIndex = currentCollectionIndex + 1;
        setCurrentCollectionIndex(nextCollectionIndex);
        setCurrentCollection(collections[nextCollectionIndex]);
        setCurrentImageIndex(0);
      } else {
        // If we're at the last image of the last collection, close the view
        onClose();
      }
    };

    const handlePrev = () => {
      const currentImages = currentCollection?.status_images || [];

      if (currentImageIndex > 0) {
        // Move to previous image in current collection
        setCurrentImageIndex((prev) => prev - 1);
      } else if (currentCollectionIndex > 0) {
        // Move to previous collection
        const prevCollectionIndex = currentCollectionIndex - 1;
        setCurrentCollectionIndex(prevCollectionIndex);
        setCurrentCollection(collections[prevCollectionIndex]);
        setCurrentImageIndex(
          collections[prevCollectionIndex].status_images.length - 1
        );
      }
    };

    const handleTouchStart = (event: any) => {
      touchStartX.current = event.nativeEvent.locationX;
      touchStartTime.current = Date.now();
    };

    const handleTouchEnd = (event: any) => {
      const touchEndX = event.nativeEvent.locationX;
      const touchEndTime = Date.now();
      const swipeDistance = touchEndX - touchStartX.current;
      const touchDuration = touchEndTime - touchStartTime.current;

      // If touch duration is less than 200ms, it's a tap
      if (touchDuration < 200) {
        if (swipeDistance > 50) {
          // Swipe right - go to previous
          handlePrev();
        } else if (swipeDistance < -50) {
          // Swipe left - go to next
          handleNext();
        } else {
          // Tap - toggle pause
          setIsPaused(!isPaused);
          if (!isPaused) {
            progressAnim.stopAnimation();
            if (timerRef.current) {
              clearTimeout(timerRef.current);
            }
          } else {
            startProgressAnimation();
          }
        }
      }
    };

    // --- Add this useEffect to handle invalid collections/index ---
    React.useEffect(() => {
      if (
        isVisible &&
        (!collections ||
          collections.length === 0 ||
          initialCollectionIndex < 0 ||
          initialCollectionIndex >= collections.length)
      ) {
        logger.error(
          "🔍 StatusView: Invalid collections data or index, closing modal",
          collections,
          initialCollectionIndex
        );
        onClose();
      }
    }, [isVisible, collections, initialCollectionIndex, onClose]);

    // --- Add this useEffect to handle missing status_images ---
    React.useEffect(() => {
      if (
        isVisible &&
        currentCollection &&
        (!currentCollection.status_images ||
          currentCollection.status_images.length === 0)
      ) {
        logger.error(
          "🔍 StatusView: No status_images in currentCollection:",
          currentCollection
        );
        onClose();
      }
    }, [isVisible, currentCollection, onClose]);

    // Utility to get image source for local/remote/relative
    const getImageSource = (
      path: string | number | undefined | null
    ): import("react-native").ImageSourcePropType | undefined => {
      if (!path) return undefined;
      if (typeof path === "number") return path; // local require
      if (typeof path === "string") {
        if (path.startsWith("http")) return { uri: path };
        // Prepend base URL for relative paths (avoid double slashes)
        return {
          uri: `${theme.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
        };
      }
      return undefined;
    };

    // Check if we should render - moved to render logic instead of early returns
    const shouldRender =
      collections &&
      collections.length > 0 &&
      initialCollectionIndex >= 0 &&
      initialCollectionIndex < collections.length &&
      currentCollection &&
      currentCollection.status_images &&
      currentCollection.status_images.length > 0;

    return (
      <Modal
        visible={isVisible && shouldRender}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <View style={styles.progressContainer}>
                {currentCollection?.status_images?.map(
                  (_: unknown, index: number) => (
                    <View key={index} style={styles.progressBarContainer}>
                      <Animated.View
                        style={[
                          styles.progressBar,
                          {
                            width:
                              index === currentImageIndex
                                ? progressAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: ["0%", "100%"],
                                })
                                : index < currentImageIndex
                                  ? "100%"
                                  : "0%",
                            borderColor: !viewedStatus[index]
                              ? theme.colors.success
                              : "rgba(255,255,255,0.3)", // green if not viewed
                            borderWidth: 2,
                          },
                        ]}
                      />
                    </View>
                  )
                )}
              </View>
              <View style={styles.headerContent}>
                <View style={styles.userInfo}>
                  {currentCollection?.thumbnail ? (
                    <Image
                      source={
                        getImageSource(currentCollection?.thumbnail) ?? undefined
                      }
                      style={styles.avatar}
                      onError={(e) => {
                        logger.error(
                          "Avatar image failed to load:",
                          getImageSource(currentCollection?.thumbnail),
                          e.nativeEvent
                        );
                      }}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: theme.colors.textMediumGrey,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Ionicons
                        name="image"
                        size={20}
                        color={theme.colors.white}
                      />
                    </View>
                  )}
                  <Text style={styles.username}>
                    {currentCollection?.name || "Unknown Collection"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableWithoutFeedback
              onPressIn={handleTouchStart}
              onPressOut={handleTouchEnd}
            >
              <View style={styles.imageContainer}>
                {currentCollection?.status_images?.[currentImageIndex] ? (
                  <Image
                    source={
                      getImageSource(
                        currentCollection?.status_images?.[currentImageIndex]
                      ) ?? undefined
                    }
                    style={dynamicStyles.statusImage}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                    onError={(e) => {
                      logger.error(
                        "Status image failed to load:",
                        getImageSource(
                          currentCollection?.status_images?.[currentImageIndex]
                        ),
                        e.nativeEvent
                      );
                      setImageLoading(false);
                    }}
                  />
                ) : (
                  <View
                    style={[
                      dynamicStyles.statusImage,
                      {
                        backgroundColor: theme.colors.textDarkGrey,
                        justifyContent: "center",
                        alignItems: "center",
                      },
                    ]}
                  >
                    <Text style={{ color: theme.colors.white, fontSize: 16 }}>
                      No image available
                    </Text>
                  </View>
                )}
                {imageLoading && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.gold}
                      accessibilityLabel="Loading image"
                    />
                  </View>
                )}
                {isPaused && (
                  <View style={styles.pauseOverlay}>
                    <Ionicons name="pause" size={40} color={theme.colors.white} />
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>

            <View style={styles.navigationContainer}>
              <TouchableOpacity
                style={[dynamicStyles.navButton, styles.leftButton]}
                onPress={handlePrev}
              >
                <Ionicons
                  name="chevron-back"
                  size={30}
                  color={theme.colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[dynamicStyles.navButton, styles.rightButton]}
                onPress={handleNext}
              >
                <Ionicons
                  name="chevron-forward"
                  size={30}
                  color={theme.colors.white}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    );
  }
);

StatusView.displayName = "StatusView";

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "100%",
    height: "95%",
    maxWidth: 600,
    backgroundColor: theme.colors.black,
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 10,
  },
  progressContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  progressBarContainer: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 2,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.white,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    zIndex: 2,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  navigationContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftButton: {
    left: 0,
  },
  rightButton: {
    right: 0,
  },
});

export default StatusView;

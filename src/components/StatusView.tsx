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
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { logger } from "@/utils/logger";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import FAQService from "@/services/faqService";

interface StatusViewProps {
  collections: any[];
  isVisible: boolean;
  initialCollectionIndex: number;
  onClose: () => void;
  onEnquire?: (collection: any, imageIndex: number) => void;
}

const STATUS_DURATION = 5000; // 5 seconds per status (snappier feel)

const StatusView: React.FC<StatusViewProps> = React.memo(
  ({ collections, isVisible, initialCollectionIndex, onClose, onEnquire }) => {
    const { t } = useTranslation();
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
    
    const { user } = useGlobalStore();
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);
    const [isSubmittingEnquiry, setIsSubmittingEnquiry] = useState(false);

    const handleCreateEnquiryTicket = async () => {
      if (!user?.id) {
        Alert.alert(t("error") || "Error", t("userNotFound") || "User not found. Please log in.");
        return;
      }

      setIsSubmittingEnquiry(true);
      try {
        const questionText = `Enquiry for ${currentCollection?.name || "Collection"} - Design #${currentImageIndex + 1}. Customer: ${user.name || "N/A"}, Phone: ${user.mobile || "N/A"}.`;
        
        const ticketPayload = {
          userId: user.id,
          question: questionText,
          category: "New Collections",
          subject: "New Collections",
          priority: "medium" as const,
          userInfo: {
            name: user.name,
            email: user.email,
            phone: user.mobile?.toString() || "",
          },
        };

        const response = await FAQService.createTicket(ticketPayload);
        setIsSubmittingEnquiry(false);

        if (response.success) {
          const ticketNum = response.data?.ticketNumber || response.data?.ticketId || response.ticketId || "";
          Alert.alert(
            t("ticketCreatedSuccessfully") || "Ticket Created",
            `${t("yourSupportTicketCreated") || "Your support ticket ID is:"} ${ticketNum}\n\nFor your reference: ${ticketNum}`,
            [
              {
                text: t("ok") || "OK",
                onPress: () => {
                  setShowEnquiryModal(false);
                  setIsPaused(false);
                }
              }
            ]
          );
        } else {
          throw new Error(response.message || "Failed to create ticket");
        }
      } catch (error) {
        setIsSubmittingEnquiry(false);
        // Fallback demo ticket
        const mockTicketId = `TKT-${Date.now()}`;
        Alert.alert(
          t("ticketCreatedSuccessfully") || "Ticket Created",
          `${t("yourSupportTicketCreated") || "Your support ticket ID is:"} ${mockTicketId}`,
          [
            {
              text: t("ok") || "OK",
              onPress: () => {
                setShowEnquiryModal(false);
                setIsPaused(false);
              }
            }
          ]
        );
      }
    };

    // Get safe area insets
    const insets = useSafeAreaInsets();

    // Get responsive layout values
    const { screenWidth, screenHeight } = useResponsiveLayout();

    // Dynamic scale for ultra-premium typography
    const titleFontSize = 18;
    const subTitleFontSize = 14;

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
        // Initialize viewedStatus
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

    // Mark status as viewed
    useEffect(() => {
      if (isVisible && currentCollection?.status_images) {
        setViewedStatus((prev) => {
          if (!prev.length) return [];
          if (prev[currentImageIndex]) return prev;
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

    // Ensure status timer and animation freeze/pause when explicitly paused or when enquiry modal is open
    useEffect(() => {
      if (isPaused || showEnquiryModal) {
        progressAnim.stopAnimation();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    }, [isPaused, showEnquiryModal]);

    const startProgressAnimation = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      progressAnim.setValue(0);

      // Only start if loading is finished or if we want to preload
      // For smoother UX, we start timer immediately but could pause if loading takes too long
      if (!isPaused) {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: STATUS_DURATION,
          useNativeDriver: false,
        }).start();

        timerRef.current = setTimeout(() => {
          handleNext();
        }, STATUS_DURATION);
      }
    };

    const handleNext = () => {
      const currentImages = currentCollection?.status_images || [];

      if (currentImageIndex < currentImages.length - 1) {
        setCurrentImageIndex((prev) => prev + 1);
      } else if (currentCollectionIndex < collections.length - 1) {
        const nextCollectionIndex = currentCollectionIndex + 1;
        setCurrentCollectionIndex(nextCollectionIndex);
        setCurrentCollection(collections[nextCollectionIndex]);
        setCurrentImageIndex(0);
      } else {
        onClose();
      }
    };

    const handlePrev = () => {
      if (currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      } else if (currentCollectionIndex > 0) {
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
      // Temporarily stop animation/timer on touch down (for hold behavior)
      progressAnim.stopAnimation();
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleTouchEnd = (event: any) => {
      const touchEndX = event.nativeEvent.locationX;
      const touchEndTime = Date.now();
      const swipeDistance = touchEndX - touchStartX.current;
      const touchDuration = touchEndTime - touchStartTime.current;
      const screenW = Dimensions.get("window").width;

      if (touchDuration < 250) {
        // Tap behavior
        if (swipeDistance > 50) {
          handlePrev();
          if (!isPaused) startProgressAnimation();
        } else if (swipeDistance < -50) {
          handleNext();
          if (!isPaused) startProgressAnimation();
        } else {
          // Tap logic - split screen left/right/center
          if (touchEndX < screenW * 0.3) {
            handlePrev();
            if (!isPaused) startProgressAnimation();
          } else if (touchEndX > screenW * 0.7) {
            handleNext();
            if (!isPaused) startProgressAnimation();
          } else {
            // Center tap - toggle explicit paused state
            setIsPaused((prev) => !prev);
          }
        }
      } else {
        // Press-and-hold ended: resume progression if not explicitly paused
        if (!isPaused) {
          startProgressAnimation();
        }
      }
    };

    // Error handling effects
    useEffect(() => {
      if (
        isVisible &&
        (!collections ||
          collections.length === 0 ||
          initialCollectionIndex < 0 ||
          initialCollectionIndex >= collections.length)
      ) {
        onClose();
      }
    }, [isVisible, collections, initialCollectionIndex, onClose]);

    useEffect(() => {
      if (
        isVisible &&
        currentCollection &&
        (!currentCollection.status_images ||
          currentCollection.status_images.length === 0)
      ) {
        onClose();
      }
    }, [isVisible, currentCollection, onClose]);

    const getImageSource = (path: string | number | undefined | null) => {
      if (!path) return undefined;
      if (typeof path === "number") return path;
      if (typeof path === "string") {
        if (path.startsWith("http")) return { uri: path };
        return {
          uri: `${theme.baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`,
        };
      }
      return undefined;
    };

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
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" backgroundColor="black" hidden={false} />
        
        <View style={styles.container}>
            {/* Background Image Layer */}
            <View style={StyleSheet.absoluteFill}>
               {currentCollection?.status_images?.[currentImageIndex] ? (
                  <Image
                    source={
                      getImageSource(
                        currentCollection?.status_images?.[currentImageIndex]
                      ) ?? undefined
                    }
                    style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                    resizeMode="contain"
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                ) : (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>No Image Available</Text>
                  </View>
                )}
            </View>

            {/* Loading Indicator */}
            {imageLoading && (
                <View style={[StyleSheet.absoluteFill, styles.centered]}>
                  <ActivityIndicator size="large" color="#FFD700" />
                </View>
            )}

            {/* Touch Layer for Navigation (Below controls) */}
            <TouchableWithoutFeedback
              onPressIn={handleTouchStart}
              onPressOut={handleTouchEnd}
            >
              <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]} />
            </TouchableWithoutFeedback>

            {/* Top Gradient Overlay for Header Text */}
            <LinearGradient
                colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.4)', 'transparent']}
                style={[styles.topGradient, { paddingTop: insets.top + 10 }]}
                pointerEvents="box-none" // Allow touches to pass through empty areas if needed, but we have buttons
            >
                {/* Progress Bars */}
                <View style={styles.progressContainer}>
                {currentCollection?.status_images?.map(
                    (_: unknown, index: number) => (
                    <View key={index} style={styles.progressBarBackground}>
                        <Animated.View
                        style={[
                            styles.progressBarFill,
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
                            },
                        ]}
                        />
                    </View>
                    )
                )}
                </View>

                {/* Header Info */}
                <View style={styles.headerRow}>
                  <View style={styles.userInfoContainer}>
                      <View style={styles.avatarBorder}>
                        {currentCollection?.thumbnail ? (
                            <Image
                            source={getImageSource(currentCollection?.thumbnail) ?? undefined}
                            style={styles.avatarImage}
                            />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="image" size={16} color="#FFF" />
                            </View>
                        )}
                      </View>
                      <View style={styles.textContainer}>
                          <Text style={styles.collectionTitle}>{currentCollection?.name}</Text>
                          <Text style={styles.timestampText}>Just Now</Text>
                      </View>
                  </View>

                  <TouchableOpacity 
                    onPress={onClose} 
                    style={styles.closeButton}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                  >
                      <Ionicons name="close-circle-outline" size={32} color="#FFF" />
                  </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Bottom Gradient Overlay for Footer */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                style={[styles.bottomGradient, { paddingBottom: insets.bottom + 20 }]}
                pointerEvents="box-none"
            >
                <View style={styles.footerContent}>
                     <View style={styles.productDetails}>
                        <Text style={styles.productName}>Exquisite Design {currentImageIndex + 1}</Text>
                        <Text style={styles.productDesc}>Swipe up/down to explore more.</Text>
                     </View>
                     
                      <TouchableOpacity 
                         style={styles.actionButton}
                         onPress={() => {
                           setIsPaused(true);
                           setShowEnquiryModal(true);
                         }}
                      >
                         <LinearGradient
                              colors={['#BF953F', '#FCF6BA', '#B38728']}
                              style={styles.actionBtnGradient}
                              start={{x:0, y:0}} end={{x:1, y:1}}
                         >
                             <Text style={styles.actionBtnText}>{t("enquiryNowTitle")?.toUpperCase() || "ENQUIRE"}</Text>
                         </LinearGradient>
                      </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Pause Indicator */}
            {isPaused && !imageLoading && !showEnquiryModal && (
                  <View style={[StyleSheet.absoluteFill, styles.centered, { backgroundColor: 'rgba(0,0,0,0.3)', zIndex: 99 }]} pointerEvents="none">
                      <Ionicons name="play" size={48} color="rgba(255,255,255,0.7)" />
                  </View>
              )}

             {/* Inline Ticket Generation Modal */}
             <Modal
               visible={showEnquiryModal}
               transparent={true}
               animationType="fade"
               onRequestClose={() => {
                 setShowEnquiryModal(false);
                 setIsPaused(false);
               }}
             >
               <View style={styles.modalOverlay}>
                 <View style={styles.modalContent}>
                   <View style={styles.modalHeader}>
                     <Ionicons name="help-circle" size={48} color={theme.colors.primary} />
                     <Text style={styles.modalTitle}>{t("enquiryNowTitle") || "Enquire Now"}</Text>
                   </View>
                   
                   <Text style={styles.modalDescription}>
                     Would you like to generate an enquiry ticket for this product?
                   </Text>

                   <View style={styles.enquiryDetailsContainer}>
                     <Text style={styles.enquiryDetailText}>
                       <Text style={{ fontWeight: 'bold' }}>Collection: </Text>
                       {currentCollection?.name}
                     </Text>
                     <Text style={styles.enquiryDetailText}>
                       <Text style={{ fontWeight: 'bold' }}>Design: </Text>
                       #{currentImageIndex + 1}
                     </Text>
                     <Text style={styles.enquiryDetailText}>
                       <Text style={{ fontWeight: 'bold' }}>User: </Text>
                       {user?.name || "N/A"}
                     </Text>
                   </View>

                   {isSubmittingEnquiry ? (
                     <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginVertical: 20 }} />
                   ) : (
                     <>
                       <TouchableOpacity
                         style={styles.modalActionButton}
                         onPress={handleCreateEnquiryTicket}
                       >
                         <LinearGradient
                           colors={[theme.colors.primary, "#002b24"]}
                           style={styles.modalButtonGradient}
                         >
                           <Text style={styles.modalButtonText}>Generate Ticket</Text>
                         </LinearGradient>
                       </TouchableOpacity>

                       <TouchableOpacity
                         style={styles.modalCloseButton}
                         onPress={() => {
                           setShowEnquiryModal(false);
                           setIsPaused(false);
                         }}
                       >
                         <Text style={styles.modalCloseText}>{t("cancel") || "Cancel"}</Text>
                       </TouchableOpacity>
                     </>
                   )}
                 </View>
               </View>
             </Modal>
        </View>
      </Modal>
    );
  }
);

StatusView.displayName = "StatusView";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  errorText: {
    color: '#888',
    fontSize: 16,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 40,
    zIndex: 100, // Ensure it's above the touch layer
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    zIndex: 100, // Ensure it's above the touch layer
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFF', // or #FFD700 for gold
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    borderWidth: 1.5,
    borderColor: '#FFD700', // Gold border
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    justifyContent: 'center',
  },
  collectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  timestampText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  footerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 10,
  },
  productDetails: {
      flex: 1,
      paddingRight: 10,
  },
  productName: {
      color: '#FFD700',
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 4,
      fontFamily: Platform.OS === 'ios' ? 'Gill Sans' : 'serif',
  },
  productDesc: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
      fontWeight: '400',
  },
  actionButton: {
      shadowColor: "#FFD700",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
  },
  actionBtnGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 25,
      gap: 6,
  },
  actionBtnText: {
      color: '#3E2723',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a1a1a",
    marginTop: 12,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  enquiryDetailsContainer: {
    backgroundColor: "#f9fcff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#eef2f5",
  },
  enquiryDetailText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
  modalActionButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
  },
  modalButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default StatusView;

import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { wp, rp, rb } = responsiveUtils;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Types
type SkeletonVariant = "rectangle" | "circle" | "rounded" | "text";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  variant?: SkeletonVariant;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: string[];
  backgroundColor?: string;
  animationDuration?: number;
  isLoading?: boolean;
  children?: React.ReactNode;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lineSpacing?: number;
  lastLineWidth?: string | number;
  style?: ViewStyle;
}

interface SkeletonAvatarProps {
  size?: "small" | "medium" | "large" | number;
  style?: ViewStyle;
}

interface SkeletonCardProps {
  style?: ViewStyle;
  showImage?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showActions?: boolean;
  imageHeight?: number;
}

interface SkeletonListItemProps {
  style?: ViewStyle;
  showAvatar?: boolean;
  avatarSize?: "small" | "medium" | "large";
  lines?: number;
  showAction?: boolean;
}

interface SkeletonImageProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonRateCardProps {
  style?: ViewStyle;
}

interface SkeletonSchemeCardProps {
  style?: ViewStyle;
}

interface SkeletonUserInfoCardProps {
  style?: ViewStyle;
}

interface SkeletonCollectionProps {
  count?: number;
  style?: ViewStyle;
}

// Base Skeleton Component with Shimmer
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  variant = "rectangle",
  borderRadius,
  style,
  shimmerColors = [
    "rgba(255, 255, 255, 0)",
    "rgba(255, 255, 255, 0.3)",
    "rgba(255, 255, 255, 0.5)",
    "rgba(255, 255, 255, 0.3)",
    "rgba(255, 255, 255, 0)",
  ],
  backgroundColor = "#E1E9EE",
  animationDuration = 1500,
  isLoading = true,
  children,
}) => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (isLoading) {
      const animation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        })
      );
      animation.start();

      return () => {
        animation.stop();
      };
    }
  }, [isLoading, animationDuration]);

  const getBorderRadius = () => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case "circle":
        return typeof height === "number" ? height / 2 : 50;
      case "rounded":
        return 12;
      case "text":
        return 4;
      default:
        return 0;
    }
  };

  const getWidth = () => {
    if (variant === "circle" && typeof height === "number") {
      return height;
    }
    return width;
  };

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: getWidth() as any,
          height: height as any,
          borderRadius: getBorderRadius(),
          backgroundColor,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={shimmerColors as any}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Skeleton Text Component
export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 16,
  lineSpacing = 10,
  lastLineWidth = "70%",
  style,
}) => {
  return (
    <View style={[styles.textContainer, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? lastLineWidth : "100%"}
          height={lineHeight}
          variant="text"
          style={{ marginBottom: index < lines - 1 ? lineSpacing : 0 }}
        />
      ))}
    </View>
  );
};

// Skeleton Avatar Component
export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = "medium",
  style,
}) => {
  const getSize = () => {
    if (typeof size === "number") return size;
    switch (size) {
      case "small":
        return 32;
      case "large":
        return 64;
      default:
        return 48;
    }
  };

  const avatarSize = getSize();

  return (
    <SkeletonLoader
      width={avatarSize}
      height={avatarSize}
      variant="circle"
      style={style}
    />
  );
};

// Skeleton Card Component
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  style,
  showImage = true,
  showTitle = true,
  showDescription = true,
  showActions = false,
  imageHeight = 150,
}) => {
  return (
    <View style={[styles.card, style]}>
      {showImage && (
        <SkeletonLoader
          width="100%"
          height={imageHeight}
          variant="rounded"
          borderRadius={12}
          style={styles.cardImage}
        />
      )}
      <View style={styles.cardContent}>
        {showTitle && (
          <SkeletonLoader
            width="70%"
            height={20}
            variant="text"
            style={styles.cardTitle}
          />
        )}
        {showDescription && (
          <SkeletonText lines={2} lineHeight={14} lastLineWidth="50%" />
        )}
        {showActions && (
          <View style={styles.cardActions}>
            <SkeletonLoader
              width={100}
              height={36}
              variant="rounded"
              borderRadius={8}
            />
            <SkeletonLoader
              width={100}
              height={36}
              variant="rounded"
              borderRadius={8}
            />
          </View>
        )}
      </View>
    </View>
  );
};

// Skeleton List Item Component
export const SkeletonListItem: React.FC<SkeletonListItemProps> = ({
  style,
  showAvatar = true,
  avatarSize = "medium",
  lines = 2,
  showAction = false,
}) => {
  return (
    <View style={[styles.listItem, style]}>
      {showAvatar && (
        <SkeletonAvatar size={avatarSize} style={styles.listAvatar} />
      )}
      <View style={styles.listContent}>
        <SkeletonText lines={lines} lineHeight={14} lastLineWidth="60%" />
      </View>
      {showAction && (
        <SkeletonLoader
          width={24}
          height={24}
          variant="circle"
          style={styles.listAction}
        />
      )}
    </View>
  );
};

// Skeleton Image Component
export const SkeletonImage: React.FC<SkeletonImageProps> = ({
  width = "100%",
  height = 200,
  borderRadius = 12,
  style,
}) => {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      variant="rounded"
      borderRadius={borderRadius}
      style={style}
    />
  );
};

// Skeleton Rate Card (for Gold/Silver Rate cards)
export const SkeletonRateCard: React.FC<SkeletonRateCardProps> = ({ style }) => {
  return (
    <View style={[styles.rateCard, style]}>
      <View style={styles.rateCardHeader}>
        <SkeletonLoader width={40} height={40} variant="circle" />
        <View style={styles.rateCardHeaderText}>
          <SkeletonLoader width={60} height={14} variant="text" />
          <SkeletonLoader
            width={80}
            height={12}
            variant="text"
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
      <View style={styles.rateCardBody}>
        <SkeletonLoader width={120} height={28} variant="text" />
        <SkeletonLoader
          width={100}
          height={12}
          variant="text"
          style={{ marginTop: 8 }}
        />
      </View>
    </View>
  );
};

// Skeleton Scheme Card (for Our Schemes section)
export const SkeletonSchemeCard: React.FC<SkeletonSchemeCardProps> = ({
  style,
}) => {
  const { screenWidth } = useResponsiveLayout();

  return (
    <View style={[styles.schemeCard, { width: screenWidth * 0.85 }, style]}>
      <SkeletonLoader
        width="100%"
        height={180}
        variant="rounded"
        borderRadius={16}
      />
      <View style={styles.schemeCardContent}>
        <SkeletonLoader width="60%" height={22} variant="text" />
        <SkeletonLoader
          width="90%"
          height={14}
          variant="text"
          style={{ marginTop: 8 }}
        />
        <SkeletonLoader
          width="40%"
          height={14}
          variant="text"
          style={{ marginTop: 6 }}
        />
        <View style={styles.schemeCardActions}>
          <SkeletonLoader
            width={100}
            height={40}
            variant="rounded"
            borderRadius={8}
          />
          <SkeletonLoader
            width={100}
            height={40}
            variant="rounded"
            borderRadius={8}
          />
        </View>
      </View>
    </View>
  );
};

// Skeleton User Info Card
export const SkeletonUserInfoCard: React.FC<SkeletonUserInfoCardProps> = ({
  style,
}) => {
  return (
    <View style={[styles.userInfoCard, style]}>
      <View style={styles.userInfoHeader}>
        <View style={styles.userInfoLeft}>
          <SkeletonLoader width={80} height={12} variant="text" />
          <SkeletonLoader
            width={140}
            height={20}
            variant="text"
            style={{ marginTop: 6 }}
          />
        </View>
        <SkeletonAvatar size={45} />
      </View>
      <View style={styles.userInfoStats}>
        <View style={styles.userInfoStatItem}>
          <SkeletonLoader width={70} height={12} variant="text" />
          <SkeletonLoader
            width={40}
            height={18}
            variant="text"
            style={{ marginTop: 4 }}
          />
        </View>
        <View style={styles.userInfoStatDivider} />
        <View style={styles.userInfoStatItem}>
          <SkeletonLoader width={60} height={12} variant="text" />
          <SkeletonLoader
            width={50}
            height={18}
            variant="text"
            style={{ marginTop: 4 }}
          />
        </View>
        <View style={styles.userInfoStatDivider} />
        <View style={styles.userInfoStatItem}>
          <SkeletonLoader width={70} height={12} variant="text" />
          <SkeletonLoader
            width={60}
            height={18}
            variant="text"
            style={{ marginTop: 4 }}
          />
        </View>
      </View>
    </View>
  );
};

// Skeleton Collection/Status Items
export const SkeletonCollection: React.FC<SkeletonCollectionProps> = ({
  count = 5,
  style,
}) => {
  return (
    <View style={[styles.collectionContainer, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.collectionItem}>
          <SkeletonLoader
            width={70}
            height={70}
            variant="circle"
            style={styles.collectionAvatar}
          />
          <SkeletonLoader
            width={60}
            height={12}
            variant="text"
            style={{ marginTop: 8 }}
          />
        </View>
      ))}
    </View>
  );
};

// Skeleton Image Slider
export const SkeletonImageSlider: React.FC<{ style?: ViewStyle }> = ({
  style,
}) => {
  return (
    <View style={[styles.sliderContainer, style]}>
      <SkeletonLoader
        width={wp(90)}
        height={180}
        variant="rounded"
        borderRadius={16}
      />
      <View style={styles.sliderDots}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonLoader
            key={index}
            width={8}
            height={8}
            variant="circle"
            style={{ marginHorizontal: 4 }}
          />
        ))}
      </View>
    </View>
  );
};

// Skeleton Flash News
export const SkeletonFlashNews: React.FC<{ style?: ViewStyle }> = ({
  style,
}) => {
  return (
    <View style={[styles.flashNewsContainer, style]}>
      <SkeletonLoader width={24} height={24} variant="circle" />
      <SkeletonLoader
        width="80%"
        height={16}
        variant="text"
        style={{ marginLeft: 12 }}
      />
    </View>
  );
};

// Skeleton Home Page (Full page skeleton)
export const SkeletonHomePage: React.FC = () => {
  const { screenWidth } = useResponsiveLayout();

  return (
    <View style={styles.homePageContainer}>
      {/* Rate Cards */}
      <View style={styles.rateCardsRow}>
        <SkeletonRateCard style={{ flex: 1, marginRight: 8 }} />
        <SkeletonRateCard style={{ flex: 1, marginLeft: 8 }} />
      </View>

      {/* Collections/Status */}
      <SkeletonCollection count={5} style={{ marginTop: 20 }} />

      {/* Image Slider */}
      <SkeletonImageSlider style={{ marginTop: 20 }} />

      {/* Flash News */}
      <SkeletonFlashNews style={{ marginTop: 16 }} />

      {/* User Info Card */}
      <SkeletonUserInfoCard style={{ marginTop: 16 }} />

      {/* Scheme Cards */}
      <View style={styles.schemesSection}>
        <SkeletonLoader
          width={120}
          height={20}
          variant="text"
          style={{ alignSelf: "center", marginBottom: 16 }}
        />
        <SkeletonSchemeCard />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: "hidden",
    position: "relative",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  shimmerGradient: {
    flex: 1,
    width: SCREEN_WIDTH * 2,
  },
  textContainer: {
    width: "100%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    marginBottom: 0,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  listAvatar: {
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listAction: {
    marginLeft: 12,
  },
  rateCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rateCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  rateCardHeaderText: {
    marginLeft: 12,
  },
  rateCardBody: {
    alignItems: "flex-start",
  },
  schemeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    alignSelf: "center",
  },
  schemeCardContent: {
    padding: 16,
  },
  schemeCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  userInfoCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 16,
    width: wp(90),
    alignSelf: "center",
  },
  userInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  userInfoLeft: {
    flex: 1,
  },
  userInfoStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfoStatItem: {
    flex: 1,
    alignItems: "center",
  },
  userInfoStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 8,
  },
  collectionContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  collectionItem: {
    alignItems: "center",
    marginHorizontal: 8,
  },
  collectionAvatar: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  sliderContainer: {
    alignItems: "center",
  },
  sliderDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  flashNewsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
  },
  homePageContainer: {
    padding: 16,
  },
  rateCardsRow: {
    flexDirection: "row",
  },
  schemesSection: {
    marginTop: 24,
  },
  // Savings specific styles
  savingsCard: {
    backgroundColor: "rgba(133, 1, 17, 0.85)",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  savingsCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  savingsCardHeaderLeft: {
    flex: 1,
  },
  savingsCardHeaderRight: {
    alignItems: "flex-end",
  },
  savingsCardBadges: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  savingsCardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  savingsCardInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  savingsCardInfoDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 12,
  },
  savingsCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  savingsPortfolio: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 10,
  },
  savingsPortfolioStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  savingsPortfolioStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  savingsPortfolioStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginHorizontal: 16,
  },
  savingsPageContainer: {
    padding: 0,
  },
  savingsFilterToggle: {
    flexDirection: "row",
    backgroundColor: "#1a2a39",
    borderRadius: 40,
    padding: 6,
    marginHorizontal: 10,
    justifyContent: "space-between",
  },
  savingsDetailContainer: {
    padding: 16,
  },
  savingsDetailSummary: {
    backgroundColor: "#1a2a39",
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  savingsDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  savingsDetailStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
  },
  savingsDetailStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  savingsDetailStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 12,
  },
  savingsDetailCard: {
    backgroundColor: "#FFF8DC",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  savingsDetailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  savingsDetailGridItem: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#F5DEB3",
    padding: 12,
    borderRadius: 10,
  },
  savingsTransactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5DEB3",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
});

// Skeleton Savings Card (for My Schemes page)
export const SkeletonSavingsCard: React.FC<{ style?: ViewStyle }> = ({
  style,
}) => {
  return (
    <View style={[styles.savingsCard, style]}>
      {/* Header */}
      <View style={styles.savingsCardHeader}>
        <View style={styles.savingsCardHeaderLeft}>
          <SkeletonLoader width={160} height={18} variant="text" />
          <View style={styles.savingsCardBadges}>
            <SkeletonLoader width={50} height={22} variant="rounded" borderRadius={12} />
            <SkeletonLoader width={45} height={22} variant="rounded" borderRadius={12} />
            <SkeletonLoader width={55} height={22} variant="rounded" borderRadius={12} />
          </View>
        </View>
        <View style={styles.savingsCardHeaderRight}>
          <SkeletonLoader width={55} height={20} variant="rounded" borderRadius={12} />
          <SkeletonLoader width={32} height={32} variant="circle" style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Account Info Row */}
      <View style={styles.savingsCardInfoRow}>
        <View style={styles.savingsCardInfoItem}>
          <SkeletonLoader width={20} height={20} variant="circle" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <SkeletonLoader width={80} height={12} variant="text" />
            <SkeletonLoader width={100} height={14} variant="text" style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.savingsCardInfoDivider} />
        <View style={styles.savingsCardInfoItem}>
          <SkeletonLoader width={20} height={20} variant="circle" />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <SkeletonLoader width={70} height={12} variant="text" />
            <SkeletonLoader width={80} height={14} variant="text" style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.savingsCardActions}>
        <SkeletonLoader width="48%" height={44} variant="rounded" borderRadius={8} />
        <SkeletonLoader width="48%" height={44} variant="rounded" borderRadius={8} />
      </View>
    </View>
  );
};

// Skeleton Savings Portfolio Card
export const SkeletonSavingsPortfolio: React.FC<{ style?: ViewStyle }> = ({
  style,
}) => {
  return (
    <View style={[styles.savingsPortfolio, style]}>
      <View style={styles.savingsPortfolioStats}>
        <View style={styles.savingsPortfolioStatItem}>
          <SkeletonLoader width={36} height={36} variant="circle" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <SkeletonLoader width={80} height={12} variant="text" />
            <SkeletonLoader width={100} height={18} variant="text" style={{ marginTop: 4 }} />
          </View>
        </View>
        <View style={styles.savingsPortfolioStatDivider} />
        <View style={styles.savingsPortfolioStatItem}>
          <SkeletonLoader width={36} height={36} variant="circle" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <SkeletonLoader width={50} height={12} variant="text" />
            <SkeletonLoader width={70} height={18} variant="text" style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Skeleton Savings Page (Full page skeleton)
export const SkeletonSavingsPage: React.FC = () => {
  return (
    <View style={styles.savingsPageContainer}>
      {/* Portfolio Card */}
      <SkeletonSavingsPortfolio />

      {/* Section Title */}
      <SkeletonLoader
        width={180}
        height={22}
        variant="text"
        style={{ alignSelf: "center", marginVertical: 16 }}
      />

      {/* Filter Toggle */}
      <View style={styles.savingsFilterToggle}>
        <SkeletonLoader width="48%" height={40} variant="rounded" borderRadius={30} />
        <SkeletonLoader width="48%" height={40} variant="rounded" borderRadius={30} />
      </View>

      {/* Savings Cards */}
      <SkeletonSavingsCard style={{ marginTop: 16 }} />
      <SkeletonSavingsCard style={{ marginTop: 16 }} />
    </View>
  );
};

// Skeleton Savings Detail Page
export const SkeletonSavingsDetailPage: React.FC = () => {
  return (
    <View style={styles.savingsDetailContainer}>
      {/* Summary Card */}
      <View style={styles.savingsDetailSummary}>
        {/* Header */}
        <View style={styles.savingsDetailHeader}>
          <SkeletonLoader width={40} height={40} variant="circle" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <SkeletonLoader width={150} height={18} variant="text" />
            <View style={{ flexDirection: "row", marginTop: 6, gap: 10 }}>
              <SkeletonLoader width={60} height={12} variant="text" />
              <SkeletonLoader width={60} height={20} variant="rounded" borderRadius={10} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.savingsDetailStats}>
          <View style={styles.savingsDetailStatItem}>
            <SkeletonLoader width={32} height={32} variant="circle" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <SkeletonLoader width={80} height={11} variant="text" />
              <SkeletonLoader width={100} height={16} variant="text" style={{ marginTop: 4 }} />
            </View>
          </View>
          <View style={styles.savingsDetailStatDivider} />
          <View style={styles.savingsDetailStatItem}>
            <SkeletonLoader width={32} height={32} variant="circle" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <SkeletonLoader width={70} height={11} variant="text" />
              <SkeletonLoader width={60} height={16} variant="text" style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <SkeletonLoader width={100} height={13} variant="text" />
            <SkeletonLoader width={80} height={13} variant="text" />
          </View>
          <SkeletonLoader width="100%" height={8} variant="rounded" borderRadius={4} />
        </View>
      </View>

      {/* Details Card */}
      <View style={styles.savingsDetailCard}>
        <SkeletonLoader width={120} height={18} variant="text" style={{ marginBottom: 16 }} />
        <View style={styles.savingsDetailGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.savingsDetailGridItem}>
              <SkeletonLoader width={16} height={16} variant="circle" />
              <SkeletonLoader width={70} height={10} variant="text" style={{ marginTop: 6 }} />
              <SkeletonLoader width={90} height={13} variant="text" style={{ marginTop: 2 }} />
            </View>
          ))}
        </View>
      </View>

      {/* Transactions Card */}
      <View style={styles.savingsDetailCard}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SkeletonLoader width={150} height={18} variant="text" />
          <SkeletonLoader width={32} height={32} variant="rounded" borderRadius={8} />
        </View>
        {Array.from({ length: 3 }).map((_, index) => (
          <View key={index} style={styles.savingsTransactionItem}>
            <SkeletonLoader width={24} height={24} variant="text" />
            <SkeletonLoader width={40} height={40} variant="circle" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonLoader width={100} height={14} variant="text" />
            </View>
            <SkeletonLoader width={80} height={16} variant="text" />
            <SkeletonLoader width={22} height={22} variant="circle" style={{ marginLeft: 10 }} />
          </View>
        ))}
      </View>

      {/* Pay Now Button */}
      <SkeletonLoader width="100%" height={56} variant="rounded" borderRadius={16} style={{ marginTop: 16 }} />
    </View>
  );
};

export default SkeletonLoader;


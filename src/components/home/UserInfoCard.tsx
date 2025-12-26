import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { formatGoldWeight } from "@/utils/imageUtils";
import {
  responsiveUtils,
  getSpacingValues,
  getBorderRadius,
} from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";

const { rf } = responsiveUtils;
const spacing = getSpacingValues();
const borderRadius = getBorderRadius();
const { SHADOW_UTILS } = shadowUtils;

interface UserInfoCardProps {
  userName: string | undefined;
  activeSchemesCount: number;
  onPress: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  showTotalGold?: boolean;
  userId: number;
  profilePhoto?: string;
  profileImageError?: boolean;
  retryCount?: number;
  onImageError?: () => void;
  onImageLoad?: () => void;
}

const UserInfoCard: React.FC<UserInfoCardProps> = React.memo(
  ({
    userName,
    activeSchemesCount,
    onPress,
    userId,
    totalGoldSavings = 0,
    totalAmount = 0,
    showTotalGold = true,
    profilePhoto,
    profileImageError = false,
    retryCount = 0,
    onImageError,
    onImageLoad,
  }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const arrowOpacity = useRef(new Animated.Value(1)).current;
    const expandAnimation = useRef(new Animated.Value(0)).current;
    const rotateAnimation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowOpacity, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    }, [arrowOpacity]);

    const handleExpandCollapse = () => {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);

      Animated.parallel([
        Animated.timing(expandAnimation, {
          toValue: newExpandedState ? 1 : 0,
          duration: 400,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: false,
        }),
        Animated.timing(rotateAnimation, {
          toValue: newExpandedState ? 1 : 0,
          duration: 400,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]).start();
    };

    const rotateInterpolate = rotateAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    });

    const statsHeight = expandAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 140], // Increased slightly for breathing room
    });

    const statsOpacity = expandAnimation.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    });

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={["#4a0007", "#2e0004", "#000000"]} // Deep Premium Burgundy to Black
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Subtle Background Pattern */}
          <View style={styles.patternOverlay}>
            <MaterialCommunityIcons
              name="crown"
              size={180}
              color="rgba(255, 215, 0, 0.03)"
              style={styles.bgIcon}
            />
          </View>

          <TouchableOpacity
            style={styles.mainContent}
            onPress={handleExpandCollapse}
            activeOpacity={0.9}
          >
            <View style={styles.headerRow}>
              <View style={styles.avatarContainer}>
                {profilePhoto && !profileImageError ? (
                  <Image
                    key={`${profilePhoto}-${retryCount}`}
                    source={{ uri: profilePhoto }}
                    style={styles.avatar}
                    resizeMode="cover"
                    onLoad={onImageLoad}
                    onError={onImageError}
                  />
                ) : (
                  <LinearGradient
                    colors={["#FFD700", "#B8860B"]}
                    style={styles.avatarPlaceholder}
                  >
                    <Text style={styles.avatarInitials}>
                      {userName ? userName.substring(0, 1).toUpperCase() : "U"}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                </View>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.welcomeLabel}>{t("welcomeBack")}</Text>
                <Text style={styles.userName} numberOfLines={1}>
                  {userName?.toUpperCase() || "USER"}
                </Text>
                <View style={styles.idContainer}>
                  <Text style={styles.idLabel}>ID:</Text>
                  <Text style={styles.idValue}>{userId}</Text>
                </View>
              </View>

              <View style={styles.expandButtonContainer}>
                 <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <View style={styles.expandIcon}>
                         <Ionicons name="chevron-down" size={20} color={theme.colors.secondary} />
                    </View>
                 </Animated.View>
              </View>
            </View>

            <Animated.View
              style={[
                styles.statsWrapper,
                {
                  height: statsHeight,
                  opacity: statsOpacity,
                  display: isExpanded ? "flex" : "none",
                },
              ]}
            >
              <View style={styles.divider} />
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t("activeSchemes")}</Text>
                  <Text style={styles.statValue}>{activeSchemesCount}</Text>
                </View>
                
                {showTotalGold && (
                    <View style={styles.statItem}>
                    <Text style={styles.statLabel}>{t("totalGold")}</Text>
                    <View style={styles.goldValueContainer}>
                        <Text style={styles.statValue}>
                            {formatGoldWeight(totalGoldSavings).replace(" g", "")}
                        </Text>
                        <Text style={styles.statUnit}>g</Text>
                    </View>
                    </View>
                )}
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t("totalPaid")}</Text>
                  <View style={styles.amountValueContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.statValue}>
                        {totalAmount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={onPress}
                activeOpacity={0.8}
              >
                 <LinearGradient
                    colors={["#FFD700", "#FFC107"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButtonGradient}
                 >
                    <Text style={styles.actionButtonText}>{t("viewInvestmentDetails")}</Text>
                    <Animated.View style={{ opacity: arrowOpacity, flexDirection: 'row' }}>
                        <Ionicons name="arrow-forward" size={16} color="#3E2723" />
                         <Ionicons name="arrow-forward" size={16} color="#3E2723" style={{marginLeft: -10}} />
                    </Animated.View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    marginHorizontal: spacing.lg, // Added for consistent side spacing
    borderRadius: borderRadius.large,
    ...SHADOW_UTILS.card(),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  cardGradient: {
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)", // Subtle gold border
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: -20,
    paddingBottom: -20,
  },
  bgIcon: {
    transform: [{ rotate: "-15deg" }],
  },
  mainContent: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3E2723",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderRadius: 10,
    overflow: "hidden",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  userName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idLabel: {
    fontSize: 10,
    color: theme.colors.secondary,
    fontWeight: "600",
    marginRight: 4,
  },
  idValue: {
    fontSize: 12, // Increased readability
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 1,
  },
  expandButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: spacing.sm,
  },
  expandIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,215,0,0.1)'
  },
  statsWrapper: {
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: spacing.md,
    width: '100%'
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statItem: {
    flex: 1, 
    alignItems: "center",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  goldValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline'
  },
  statUnit: {
      fontSize: 12,
      color: theme.colors.secondary,
      marginLeft: 2,
      fontWeight: '600'
  },
  amountValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline'
  },
  currencySymbol: {
      fontSize: 14,
      color: theme.colors.secondary,
      marginRight: 2,
      fontWeight: '600'
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4
  },
  actionButtonGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 6
  },
  actionButtonText: {
      color: "#3E2723",
      fontWeight: "700",
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: 0.5
  }
});

export default UserInfoCard;

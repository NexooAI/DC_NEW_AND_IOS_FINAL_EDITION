import { useAppTheme } from "@/store/global.store";
import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { moderateScale } from "react-native-size-matters";
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
    const theme = useAppTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const arrowOpacity = useRef(new Animated.Value(1)).current;
    const expandAnimation = useRef(new Animated.Value(1)).current;
    const rotateAnimation = useRef(new Animated.Value(1)).current;

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
      outputRange: [0, 100], // Reduced from 140 for a more compact card
    });

    const statsOpacity = expandAnimation.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0, 1],
    });

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.primary || "#0b162c", "#132342", "#050b15"]} // Premium Midnight Blue to Black
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <TouchableOpacity
            style={styles.mainContent}
            onPress={handleExpandCollapse}
            activeOpacity={0.9}
          >
            <View style={styles.headerRow}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={[theme.colors.secondary || "#FFD700", "#B8860B"]}
                  style={styles.avatarPlaceholder}
                >
                  <MaterialCommunityIcons name="wallet-membership" size={15} color="#3E2723" />
                </LinearGradient>
              </View>

              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {t("savingsPortfolio") || "SAVINGS PORTFOLIO"}
                </Text>
              </View>

              <View style={styles.expandButtonContainer}>
                 <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                    <View style={styles.expandIcon}>
                         <Ionicons name="chevron-down" size={16} color={theme.colors.secondary} />
                    </View>
                 </Animated.View>
              </View>
            </View>

            <Animated.View
              style={[
                styles.statsWrapper,
                {
                  height: isExpanded ? undefined : statsHeight,
                  opacity: statsOpacity,
                  display: isExpanded ? "flex" : "none",
                },
              ]}
            >
              <View style={styles.divider} />
              
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <View style={styles.statHeader}>
                    <Ionicons name="folder-open-outline" size={12} color={theme.colors.secondary || "#FFD700"} />
                    <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t("activeSchemes")}</Text>
                  </View>
                  <Text style={styles.statValue}>{activeSchemesCount}</Text>
                </View>
                
                {showTotalGold && (
                  <View style={styles.statBox}>
                    <View style={styles.statHeader}>
                      <MaterialCommunityIcons name="gold" size={13} color={theme.colors.secondary || "#FFD700"} />
                      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t("totalGold")}</Text>
                    </View>
                    <View style={styles.goldValueContainer}>
                      <Text style={styles.statValue}>
                        {formatGoldWeight(totalGoldSavings).replace(" g", "")}
                      </Text>
                      <Text style={styles.statUnit}>g</Text>
                    </View>
                  </View>
                )}
                
                <View style={styles.statBox}>
                  <View style={styles.statHeader}>
                    <Ionicons name="wallet-outline" size={12} color={theme.colors.secondary || "#FFD700"} />
                    <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t("totalPaid")}</Text>
                  </View>
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
                    colors={[theme.colors.secondary || "#FFD700", theme.colors.warning || "#FFC107"]}
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

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(4),
    width: responsiveUtils.isTabletDevice() ? 632 : "100%",
    maxWidth: "100%",
    alignSelf: responsiveUtils.isTabletDevice() ? "center" : "stretch",
  },
  cardGradient: {
    borderRadius: borderRadius.large,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.secondary ? `${theme.colors.secondary}33` : "rgba(255, 215, 0, 0.2)", // Subtle gold border
    ...SHADOW_UTILS.card(),
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  mainContent: {
    paddingHorizontal: moderateScale(12),
    paddingTop: moderateScale(8),
    paddingBottom: moderateScale(8),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: moderateScale(8),
  },
  avatar: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    borderWidth: 1.5,
    borderColor: theme.colors.secondary,
  },
  avatarPlaceholder: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  avatarInitials: {
    fontSize: moderateScale(12),
    fontWeight: "bold",
    color: "#3E2723",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    overflow: "hidden",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeLabel: {
    fontSize: moderateScale(9),
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  userName: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
    fontSize: 8,
    color: theme.colors.secondary,
    fontWeight: "600",
    marginRight: 4,
  },
  idValue: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 1,
  },
  expandButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: moderateScale(4),
  },
  expandIcon: {
      width: moderateScale(24),
      height: moderateScale(24),
      borderRadius: moderateScale(12),
      backgroundColor: 'rgba(255,255,255,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.secondary ? `${theme.colors.secondary}1a` : 'rgba(255,215,0,0.1)'
  },
  statsWrapper: {
    overflow: "hidden",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginTop: moderateScale(6),
    marginBottom: moderateScale(8),
    width: '100%'
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: moderateScale(10),
    marginHorizontal: -moderateScale(3),
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(4),
    marginHorizontal: moderateScale(3),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  statLabel: {
    fontSize: moderateScale(8.5),
    color: "rgba(255, 255, 255, 0.55)",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontWeight: "600",
  },
  statValue: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  goldValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline'
  },
  statUnit: {
      fontSize: moderateScale(9),
      color: theme.colors.secondary,
      marginLeft: 2,
      fontWeight: '600'
  },
  amountValueContainer: {
      flexDirection: 'row',
      alignItems: 'baseline'
  },
  currencySymbol: {
      fontSize: moderateScale(10),
      color: theme.colors.secondary,
      marginRight: 2,
      fontWeight: '600'
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 6,
    shadowColor: theme.colors.secondary || "#FFD700",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  actionButtonGradient: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: moderateScale(9),
      gap: 6
  },
  actionButtonText: {
      color: "#3E2723",
      fontWeight: "700",
      fontSize: moderateScale(12),
      textTransform: "uppercase",
      letterSpacing: 0.5
  }
});
}

export default UserInfoCard;

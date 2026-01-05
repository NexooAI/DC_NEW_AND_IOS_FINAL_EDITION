import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  Platform,
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
  goldRate?: string;
  silverRate?: string;
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
    goldRate,
    silverRate,
  }) => {
    const { t } = useTranslation();
    const arrowOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(arrowOpacity, {
            toValue: 0.6,
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

    return (
      <View style={styles.container}>
        {/* Main Card Container with Shadow */}
        <View style={styles.cardShadow}>
          <LinearGradient
            colors={["#5a000b", "#4a0007", "#2e0004"]} // Richer, deeper red gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            {/* Elegant Background Patterns */}
            <View style={styles.patternOverlay}>
              <MaterialCommunityIcons
                name="crown"
                size={220}
                color="rgba(255, 215, 0, 0.04)"
                style={[styles.bgIcon, { right: -30, bottom: -40 }]}
              />
              <MaterialCommunityIcons 
                 name="diamond-stone" 
                 size={100} 
                 color="rgba(255, 215, 0, 0.02)" 
                 style={{ position: 'absolute', top: 10, left: 20 }} 
              />
            </View>

            <View style={styles.mainContent}>
              <View style={styles.headerRow}>
                {/* Avatar Section */}
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={["#FFD700", "#B8860B"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarBorder}
                  >
                    <View style={styles.avatarInner}>
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
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitials}>
                            {userName ? userName.substring(0, 1).toUpperCase() : "U"}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                </View>

                {/* User Info Section */}
                <View style={styles.userInfo}>
                  <Text style={styles.welcomeLabel}>{t("welcomeBack")}</Text>
                  <Text style={styles.userName} numberOfLines={1}>
                    {userName?.toUpperCase() || "USER"}
                  </Text>
                  
                  <View style={styles.idWrapper}>
                     <LinearGradient
                        colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                        style={styles.idContainer}
                     >
                        <Text style={styles.idLabel}>ID:</Text>
                        <Text style={styles.idValue}>{userId}</Text>
                     </LinearGradient>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>{t("activeSchemes")}</Text>
                  <Text style={styles.statValue}>{activeSchemesCount}</Text>
                </View>
                
                {showTotalGold && (
                    <View style={[styles.statItem, styles.centerStatItem]}>
                    <Text style={[styles.statLabel, { color: '#FFD700' }]}>{t("totalGold")}</Text>
                    <View style={styles.goldValueContainer}>
                        <Text style={[styles.statValue, { color: '#FFD700', fontSize: 20 }]}>
                            {formatGoldWeight(totalGoldSavings).replace(" g", "")}
                        </Text>
                        <Text style={[styles.statUnit, { color: '#FFD700' }]}>g</Text>
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

               {/* Live Rates Divider */}
              {/* {(goldRate || silverRate) && <View style={styles.divider} />} */}

              {/* Live Rates Section */}
              {/* <View style={styles.ratesContainer}>
                  {goldRate && (
                     <View style={styles.rateItem}>
                         <View style={styles.rateLabelRow}>
                            <View style={[styles.rateDot, { backgroundColor: '#FFD700' }]} />
                            <Text style={[styles.rateLabel, { color: '#FFD700' }]}>Gold Rate (22k)</Text>
                         </View>
                         <Text style={styles.rateValue}>₹{goldRate}/g</Text>
                     </View>
                  )}
                  {silverRate && (
                     <View style={[styles.rateItem, { alignItems: 'flex-end' }]}>
                         <View style={styles.rateLabelRow}>
                            <View style={[styles.rateDot, { backgroundColor: '#C0C0C0' }]} />
                            <Text style={[styles.rateLabel, { color: '#C0C0C0' }]}>Silver Rate</Text>
                         </View>
                         <Text style={styles.rateValue}>₹{silverRate}/g</Text>
                     </View>
                  )}
              </View> */}

              <TouchableOpacity
                style={styles.actionButtonContainer}
                onPress={onPress}
                activeOpacity={0.85}
              >
                 <LinearGradient
                    colors={["#FFD700", "#FFC107", "#FFB300"]} // Premium Gold Gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.actionButton}
                 >
                    <View style={styles.btnContent}>
                        <Text style={styles.actionButtonText}>{t("viewInvestmentDetails")}</Text>
                        <Animated.View style={{ opacity: arrowOpacity, flexDirection: 'row', marginLeft: 4 }}>
                            <Ionicons name="arrow-forward" size={18} color="#2e0406" />
                             <Ionicons name="arrow-forward" size={18} color="#2e0406" style={{marginLeft: -10, opacity: 0.5}} />
                        </Animated.View>
                    </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
    width: "94%",
    alignSelf: "center",
    minHeight: 200,
  },
  cardShadow: {
     borderRadius: 0,
     ...Platform.select({
        ios: {
           shadowColor: "#000",
           shadowOffset: { width: 0, height: 8 },
           shadowOpacity: 0.35,
           shadowRadius: 12,
        },
        android: {
           elevation: 10,
        },
     }),
  },
  cardGradient: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.25)", // Enhanced gold border
  },
  patternOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bgIcon: {
    position: 'absolute',
    transform: [{ rotate: "-15deg" }],
  },
  mainContent: {
    padding: 20,
    // Ensure content takes up space naturally
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    // justifyContent: 'space-between' // No longer needed as we removed the chevron
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatarBorder: {
      padding: 2,
      borderRadius: 35, // Half of 70
      width: 70,
      height: 70,
  },
  avatarInner: {
      flex: 1,
      backgroundColor: '#2e0406',
      borderRadius: 33, // Slightly less
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: '#3E0005'
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFD700",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#FFF",
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Slight shadow for the badge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  welcomeLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
    letterSpacing: 2, // Elegant tracking
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4
  },
  idWrapper: {
      flexDirection: 'row',
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  idLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
    marginRight: 4,
  },
  idValue: {
    fontSize: 12,
    color: "#FFD700", // Gold text for ID
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 215, 0, 0.15)", // Gold tint divider
    marginVertical: 16,
    width: '100%'
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 4
  },
  ratesContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      paddingHorizontal: 4,
      backgroundColor: 'rgba(0,0,0,0.2)',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)'
  },
  rateItem: {
      flex: 1,
  },
  rateLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4
  },
  rateDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6
  },
  rateLabel: {
      fontSize: 10,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5
  },
  rateValue: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '700',
      marginLeft: 12 // Align with text start (dot width + margin)
  },
  statItem: {
    flex: 1, 
    alignItems: "center",
  },
  centerStatItem: {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: '600'
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
  actionButtonContainer: {
     borderRadius: 14,
     shadowColor: "#FFD700",
     shadowOffset: { width: 0, height: 4 },
     shadowOpacity: 0.2,
     shadowRadius: 8,
     elevation: 4,
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  btnContent: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 14,
  },
  actionButtonText: {
      color: "#2e0406", // Dark deep contrast against gold
      fontWeight: "800",
      fontSize: 14,
      textTransform: "uppercase",
      letterSpacing: 0.8
  }
});

export default UserInfoCard;

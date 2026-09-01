import { theme } from "@/constants/theme";
import { useAppTheme } from "@/store/global.store";
import React, { useEffect, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  TouchableOpacity,
  Linking,
  Alert,
  Text,
  View,
  Animated,
  StyleSheet,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { Ionicons } from "@expo/vector-icons";
import { t } from "@/i18n";

interface SocialMediaOptionProps {
  icon: string;
  onPress: () => void;
  platform: "facebook" | "instagram" | "youtube";
  delay?: number;
}

const SocialMediaOption: React.FC<SocialMediaOptionProps> = ({
  icon,
  onPress,
  platform,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Platform-specific colors
  const getPlatformColors = () => {
    switch (platform) {
      case "facebook":
        return {
          primary: "#1877F2",
          secondary: "#0D6EFD",
          accent: "#42A5F5",
          iconBg: "rgba(24, 119, 242, 0.15)",
          textColor: "#fff",
        };
      case "instagram":
        return {
          primary: "#E4405F",
          secondary: "#C13584",
          accent: "#F77737",
          iconBg: "rgba(228, 64, 95, 0.15)",
          textColor: "#fff",
        };
      case "youtube":
        return {
          primary: "#FF0000",
          secondary: "#CC0000",
          accent: "#FF6B6B",
          iconBg: "rgba(255, 0, 0, 0.15)",
          textColor: "#fff",
        };
      default:
        return {
          primary: "#6366F1",
          secondary: "#4F46E5",
          accent: "#818CF8",
          iconBg: "rgba(99, 102, 241, 0.15)",
          textColor: "#fff",
        };
    }
  };

  const colors = getPlatformColors();

  useEffect(() => {
    // Pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    setTimeout(() => {
      pulse.start();
    }, delay);

    return () => {
      pulse.stop();
    };
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const renderIcon = () => {
    const iconSize = 20; // Reduced from 28
    return (
      <Ionicons name={icon as any} size={iconSize} color={colors.textColor} />
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={styles.socialOptionWrapper}
    >
      <Animated.View
        style={[
          styles.socialOption,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            shadowColor: colors.primary,
          },
        ]}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary, colors.accent]}
          style={styles.socialOptionGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Icon Container */}
          <View
            style={[
              styles.socialIconContainer,
              { backgroundColor: colors.iconBg },
            ]}
          >
            {renderIcon()}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SocialMediaCard = ({
  socialMediaUrls,
  videos,
}: {
  socialMediaUrls?: any;
  videos?: any[];
}) => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const cardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const headerGlowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(cardScaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    const headerGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(headerGlowAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(headerGlowAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    headerGlow.start();

    return () => headerGlow.stop();
  }, []);

  const handleFacebook = () => {
    let facebookUrl = "https://www.facebook.com/dcjewellers.official/";
    if (socialMediaUrls?.[0]?.facebook_url) {
      facebookUrl = socialMediaUrls[0].facebook_url;
    } else if (videos?.[0]?.facebook_url) {
      facebookUrl = videos[0].facebook_url;
    }
    Linking.openURL(facebookUrl).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenFacebook"))
    );
  };

  const handleInstagram = () => {
    let instagramUrl = "https://www.instagram.com/dcjewellers.official/?hl=en";
    if (socialMediaUrls?.[0]?.intsa_url) {
      instagramUrl = socialMediaUrls[0].intsa_url;
    } else if (videos?.[0]?.insta_url) {
      instagramUrl = videos[0].insta_url;
    } else if (videos?.[0]?.intsa_url) {
      instagramUrl = videos[0].intsa_url;
    }
    Linking.openURL(instagramUrl).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenInstagram"))
    );
  };

  const handleYouTube = () => {
    let youtubeUrl = "https://www.youtube.com/@DCJewellersGoldandDiamonds?themeRefresh=1";
    if (socialMediaUrls?.[0]?.youtube_url) {
      youtubeUrl = socialMediaUrls[0].youtube_url;
    } else if (videos?.[0]?.video_url) {
      youtubeUrl = videos[0].video_url;
    } else if (videos?.[0]?.url) {
      youtubeUrl = videos[0].url;
    }
    Linking.openURL(youtubeUrl).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenYouTube"))
    );
  };

  const headerGlowOpacity = headerGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          transform: [{ scale: cardScaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={[theme.colors.primary || "#0b162c", "#132342", "#050b15"]}
        style={styles.mainGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Animated.View
            style={[
              styles.headerGlow,
              {
                opacity: headerGlowOpacity,
              },
            ]}
          />

          <View style={styles.headerContent}>
            <LinearGradient
              colors={[theme.colors.secondary || "#FFD700", "#FFC107"]}
              style={styles.mainIconContainer}
            >
              <Ionicons name="share-social" size={22} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextContainer}>
              <Text style={styles.mainTitle}>{t("followUs")}</Text>
              <Text style={styles.mainSubtitle}>{t("stayConnected")}</Text>
            </View>
          </View>
        </View>

        {/* Social Media Options - Horizontal Layout */}
        <View style={styles.socialOptionsContainer}>
          <SocialMediaOption
            icon="logo-facebook"
            onPress={handleFacebook}
            platform="facebook"
            delay={100}
          />

          <SocialMediaOption
            icon="logo-instagram"
            onPress={handleInstagram}
            platform="instagram"
            delay={200}
          />

          <SocialMediaOption
            icon="logo-youtube"
            onPress={handleYouTube}
            platform="youtube"
            delay={300}
          />
        </View>

        {/* Footer */}
        {/* <View style={styles.footerContainer}>
          <View style={styles.engagementBadge}>
            <View style={styles.engagementIndicator} />
            <Text style={styles.engagementText}>{t("activeCommunity")}</Text>
          </View>
          <Text style={styles.followersCount}>{t("thousandsOfFollowers")}</Text>
        </View> */}
      </LinearGradient>
    </Animated.View>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8), // Reduced from 10 to match Support card
    width: "100%",
  },
  mainGradient: {
    borderRadius: moderateScale(16), // Match Support card (reduced from 24)
    padding: moderateScale(14), // Match Support card (reduced from 20)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: theme.colors.secondary ? `${theme.colors.secondary}33` : "rgba(245,158,11,0.3)",
    overflow: "hidden",
    position: "relative",
  },
  headerContainer: {
    position: "relative",
  },
  headerGlow: {
    position: "absolute",
    top: -moderateScale(10),
    left: -moderateScale(10),
    right: -moderateScale(10),
    bottom: -moderateScale(10),
    backgroundColor: "rgba(245,158,11,0.05)",
    borderRadius: moderateScale(20),
    zIndex: -1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainIconContainer: {
    width: moderateScale(40), // Reduced from 56 to match Support card
    height: moderateScale(40), // Reduced from 56 to match Support card
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
    shadowColor: theme.colors.secondary || "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    color: "#fff",
    fontSize: moderateScale(16), // Reduced from 20 to match Support card
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  mainSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(12), // Reduced from 13
    marginTop: moderateScale(2),
  },
  socialOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: moderateScale(12), // Spacing after removing separator
  },
  socialOptionWrapper: {
    flex: 1,
    alignItems: "center",
  },
  socialOption: {
    borderRadius: moderateScale(23),
    width: moderateScale(46),
    height: moderateScale(46),
    overflow: "visible",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  socialOptionGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: moderateScale(23),
  },
  socialIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateScale(12),
    paddingTop: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  engagementBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(14),
  },
  engagementIndicator: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    backgroundColor: "#F59E0B",
    marginRight: moderateScale(8),
  },
  engagementText: {
    color: "#F59E0B",
    fontSize: moderateScale(11),
    fontWeight: "600",
  },
  followersCount: {
    color: "rgba(255,255,255,0.7)",
    fontSize: moderateScale(11),
  },
}) }

var styles = getStyles(theme);;

export default SocialMediaCard;

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
    const iconSize = 28;
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

const SocialMediaCard = ({ socialMediaUrls }: { socialMediaUrls: any }) => {
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
    if (socialMediaUrls[0].facebook_url !== null) {
      facebookUrl = socialMediaUrls[0].facebook_url;
    }
    Linking.openURL(facebookUrl).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenFacebook"))
    );
  };

  const handleInstagram = () => {
    let instagramUrl = "https://www.instagram.com/dcjewellers.official/?hl=en";
    if (socialMediaUrls[0].intsa_url !== null) {
      instagramUrl = socialMediaUrls[0].intsa_url;
    }
    Linking.openURL(instagramUrl).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenInstagram"))
    );
  };

  const handleYouTube = () => {
    const youtubeUrl =
      "https://www.youtube.com/@DCJewellersGoldandDiamonds?themeRefresh=1";
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
         colors={["#0F172A", "#1A1F2B", "#850111"]}
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
              colors={["#F59E0B", "#F97316", "#EA580C"]}
              style={styles.mainIconContainer}
            >
              <Ionicons name="share-social" size={28} color="#fff" />
            </LinearGradient>

            <View style={styles.headerTextContainer}>
              <Text style={styles.mainTitle}>{t("followUs")}</Text>
              <Text style={styles.mainSubtitle}>{t("stayConnected")}</Text>
            </View>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator}>
          <LinearGradient
            colors={["transparent", "#F59E0B", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separatorLine}
          />
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

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    width: "100%",
  },
  mainGradient: {
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.3)",
    overflow: "hidden",
    position: "relative",
  },
  headerContainer: {
    position: "relative",
  },
  headerGlow: {
    position: "absolute",
    top: -moderateScale(15),
    left: -moderateScale(15),
    right: -moderateScale(15),
    bottom: -moderateScale(15),
    backgroundColor: "rgba(245,158,11,0.1)",
    borderRadius: moderateScale(30),
    zIndex: -1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainIconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(16),
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    color: "#fff",
    fontSize: moderateScale(20),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  mainSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(13),
    marginTop: moderateScale(4),
  },
  separator: {
    alignItems: "center",
    marginVertical: moderateScale(16),
  },
  separatorLine: {
    height: 3,
    width: "70%",
    borderRadius: 2,
  },
  socialOptionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  socialOptionWrapper: {
    // Wrapper for touch handling
  },
  socialOption: {
    borderRadius: moderateScale(20),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 2,
  },
  socialOptionGradient: {
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(16),
    minWidth: moderateScale(50),
    minHeight: moderateScale(50),
    width: moderateScale(50),
    height: moderateScale(50),
  },
  socialIconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateScale(20),
    paddingTop: moderateScale(16),
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
});

export default SocialMediaCard;

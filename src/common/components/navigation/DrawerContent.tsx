import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
  Platform,
  Linking,
  Animated,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { LinearGradient } from 'expo-linear-gradient';

import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { getFullImageUrl } from "@/utils/imageUtils";

const { width } = Dimensions.get("window");

interface DrawerMenuItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  isLogout?: boolean;
  isActive?: boolean;
  delay?: number;
  iconColor?: string;
}

const DrawerMenuItem = ({
  label,
  iconName,
  onPress,
  disabled,
  isLogout,
  isActive,
  delay = 0,
  iconColor,
}: DrawerMenuItemProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [delay]);

  // Determine icon color
  const getIconColor = () => {
    if (disabled) return theme.colors.textMediumGrey;
    if (isLogout) return theme.colors.error;
    if (isActive) return theme.colors.primary;
    return iconColor || theme.colors.textDarkGrey;
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.menuItem,
          disabled && styles.disabledMenuItem,
          isLogout && styles.logoutMenuItem,
          isActive && styles.activeMenuItem
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={[
          styles.iconContainer, 
          isLogout && styles.logoutIconContainer,
          isActive && styles.activeIconContainer,
          // Add subtle background tint based on icon color for non-active items
          (!isActive && !isLogout && iconColor) ? { backgroundColor: iconColor + '10' } : {}
        ]}>
          <Ionicons
            name={iconName}
            size={20}
            color={getIconColor()}
          />
        </View>
        <Text style={[
          styles.menuItemText,
          disabled && styles.disabledText,
          isLogout && styles.logoutText,
          isActive && styles.activeMenuItemText
        ]}>
          {label}
        </Text>
        {!isLogout && (
          isActive ? (
             <View style={styles.activeIndicator} />
          ) : (
            <Ionicons 
              name="chevron-forward" 
              size={14} 
              color={theme.colors.textLightGrey} 
              style={styles.chevron}
            />
          )
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const SectionHeader = ({ title }: { title: string }) => (
  <View style={styles.sectionHeaderContainer}>
    <Text style={styles.sectionHeaderText}>{title}</Text>
    <View style={styles.sectionDivider} />
  </View>
);

const SocialIcon = ({ name, url, color }: { name: any, url: string, color: string }) => (
  <TouchableOpacity 
    style={styles.socialIconBtn} 
    onPress={() => Linking.openURL(url).catch(err => console.error("Couldn't load page", err))}
  >
    <View style={[styles.socialIconContainer, { backgroundColor: color + '15' }]}>
      <FontAwesome5 name={name} size={18} color={color} />
    </View>
  </TouchableOpacity>
);

interface CustomDrawerContentProps {
  navigation: {
    closeDrawer: () => void;
  };
}

export function CustomDrawerContent(props: CustomDrawerContentProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { logout, user } = useGlobalStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const version = Constants.expoConfig?.version || '1.0.0';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Reset image error when user profile changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("goodMorning") || "Good Morning";
    if (hour < 18) return t("goodAfternoon") || "Good Afternoon";
    return t("goodEvening") || "Good Evening";
  };

  const isRouteActive = (route: string) => {
    return pathname === route || pathname?.startsWith(route + '/');
  };

  const handleNavigation = useCallback(
    (route: string) => {
      if (isNavigating) return;

      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      setIsNavigating(true);
      props.navigation.closeDrawer();

      navigationTimeoutRef.current = setTimeout(() => {
        try {
          router.push(route);
        } catch (error) {
          console.error("Navigation error:", error);
          Alert.alert(t("navigationError"), t("failedToNavigate"));
        } finally {
          requestAnimationFrame(() => {
            setIsNavigating(false);
          });
        }
      }, 300);
    },
    [router, props.navigation, isNavigating, t]
  );

  const handleLogout = useCallback(() => {
    if (isNavigating) return;

    Alert.alert(
      t("logout_confirmation_title"),
      t("logout_confirmation_message"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: async () => {
            setIsNavigating(true);
            try {
              await SecureStore.deleteItemAsync("user_mpin");
              logout();
              requestAnimationFrame(() => {
                router.replace("/(auth)/login");
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(t("logoutError"), t("failedToLogout"));
            } finally {
              requestAnimationFrame(() => {
                setIsNavigating(false);
              });
            }
          },
        },
      ],
      { cancelable: false }
    );
  }, [logout, router, isNavigating, t]);

  const socialLinks = [
    { 
      name: "whatsapp", 
      url: `https://wa.me/${theme.constants.whatsapp?.replace(/\s/g, "") || theme.constants.mobile?.replace(/\s/g, "")}`, 
      color: "#25D366" 
    },
    { 
      name: "youtube", 
      url: theme.youtubeUrl || "https://youtube.com", 
      color: "#FF0000" 
    },
    { 
      name: "globe", 
      url: theme.constants.website, 
      color: "#4285F4" 
    },
    { 
      name: "phone-alt", 
      url: `tel:${theme.constants.mobile}`, 
      color: theme.colors.primary 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <View style={styles.headerContainer}>
         <LinearGradient
            colors={[theme.colors.primary, '#5a000b']}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
          <View style={styles.userInfoContainer}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarContainer}>
                {user?.profileImage && !imageError ? (
                  <Image
                    source={{ uri: getFullImageUrl(user.profileImage) }}
                    style={styles.avatar}
                    onError={(e) => {
                        console.log("Profile image load error:", e.nativeEvent.error);
                        setImageError(true);
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.avatarInitials}>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Rewards Badge - Gold on Red */}
              {/* {(user?.rewards !== undefined) && (
                <View style={styles.rewardsBadge}>
                  <Ionicons name="trophy" size={10} color={theme.colors.primary} style={{marginRight: 4}} />
                  <Text style={styles.rewardsText}>{user.rewards} Credits</Text>
                </View>
              )} */}
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.greetingText}>{getGreeting()},</Text>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || "Guest User"}
              </Text>
              {user?.email && (
                <View style={styles.emailContainer}>
                  <Ionicons name="mail-outline" size={10} color="rgba(255,255,255,0.7)" style={{marginRight: 4}}/>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Decorative Elements */}
          <View style={styles.decorativeCircle} />
          <View style={styles.decorativeCircleSmall} />
        </LinearGradient>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          {/* General Section */}
          <SectionHeader title={t("general") || "General"} />
          <DrawerMenuItem
            label={t("profile")}
            iconName="person-outline"
            onPress={() => handleNavigation("/(tabs)/profile")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/profile")}
            delay={100}
            iconColor="#4285F4" // Google Blue
          />
          <DrawerMenuItem
            label={t("referAndEarn")}
            iconName="gift-outline"
            onPress={() => handleNavigation("/(tabs)/home/refer_earn")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/refer_earn")}
            delay={150}
            iconColor="#F4B400" // Google Yellow/Gold
          />

          {/* Support Section */}
          <SectionHeader title={t("information") || "Information"} />
          <DrawerMenuItem
            label={t("ourStores")}
            iconName="storefront-outline"
            onPress={() => handleNavigation("/(tabs)/home/our_stores")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/our_stores")}
            delay={200}
            iconColor="#EA4335" // Google Red (or Branded Primary)
          />
          <DrawerMenuItem
            label={t("contactUs")}
            iconName="call-outline"
            onPress={() => handleNavigation("/(tabs)/home/contact_us")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/contact_us")}
            delay={250}
            iconColor="#0F9D58" // Google Green
          />
          <DrawerMenuItem
            label={t("faqAndHelp")}
            iconName="help-circle-outline"
            onPress={() => handleNavigation("/(tabs)/home/faq")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/faq")}
            delay={300}
            iconColor="#FB8C00" // Orange
          />

          {/* Legal Section */}
          <SectionHeader title={t("legal") || "Legal"} />
          <DrawerMenuItem
            label={t("privacyPolicy")}
            iconName="lock-closed-outline"
            onPress={() => handleNavigation("/(tabs)/home/policies/privacyPolicy")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/policies/privacyPolicy")}
            delay={350}
            iconColor="#607D8B" // Blue Grey
          />
          <DrawerMenuItem
            label={t("termsAndConditions")}
            iconName="document-text-outline"
            onPress={() => handleNavigation("/(tabs)/home/policies/termsAndConditionsPolicies")}
            disabled={isNavigating}
            isActive={isRouteActive("/(tabs)/home/policies/termsAndConditionsPolicies")}
            delay={400}
            iconColor="#607D8B" // Blue Grey
          />
        </View>

        <View style={styles.footerSpacer} />
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.logoutContainer}>
          <DrawerMenuItem
            label={t("logout")}
            iconName="log-out-outline"
            onPress={handleLogout}
            disabled={isNavigating}
            isLogout
            delay={450}
          />
        </View>

         {/* Social Links */}
        <View style={styles.socialRow}>
          {socialLinks.map((link, index) => (
            <SocialIcon key={index} name={link.name} url={link.url} color={link.color} />
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.companyName}>SRI MURUGAN GOLD HOUSE</Text>
          <Text style={styles.versionText}>v{version}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    minHeight: 190,
    width: '100%',
    overflow: 'hidden',
    borderBottomRightRadius: 24,
    marginTop: -5,
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  userInfoContainer: {
    zIndex: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  rewardsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary, // Gold
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  rewardsText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary, // Red text on Gold bg
    letterSpacing: 0.5,
  },
  userDetails: {
    marginTop: 0,
  },
  greetingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800', // Extra bold for premium feel
    color: '#fff',
    marginBottom: 6,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  decorativeCircle: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorativeCircleSmall: {
    position: 'absolute',
    right: 80,
    bottom: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    paddingTop: 16,
  },
  menuContainer: {
    paddingHorizontal: 16,
  },
  sectionHeaderContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textLightGrey,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 5,
    marginLeft: 12,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.colors.borderLight,
    opacity: 0.4,
    marginHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent', // Default
  },
  activeMenuItem: {
    backgroundColor: theme.colors.secondary + '20', // Pale Gold/Yellow (20% opacity)
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#fff',
  },
  logoutIconContainer: {
    backgroundColor: '#FFE5E5',
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textDarkGrey,
    fontWeight: '500',
    marginLeft: 14,
  },
  activeMenuItemText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  logoutText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  chevron: {
    opacity: 0.4,
  },
  disabledMenuItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.colors.textMediumGrey,
  },
  logoutMenuItem: {
    marginTop: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  footerSpacer: {
    height: 20,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
    gap: 15,
  },
  socialIconBtn: {
    padding: 5,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 10,
    opacity: 0.6,
  },
  companyName: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  versionText: {
    fontSize: 10,
    color: theme.colors.textLightGrey,
  },
});

export default CustomDrawerContent;

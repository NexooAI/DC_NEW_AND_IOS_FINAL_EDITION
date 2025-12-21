import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useGlobalStore from "@/store/global.store";
import { theme } from "@/constants/theme";
import COLORS from "../../../constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
// import { useAuth } from "../../../../contexts/AuthContext";

const { width } = Dimensions.get("window");

interface DrawerMenuItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}

const DrawerMenuItem = ({
  label,
  iconName,
  onPress,
  disabled,
}: DrawerMenuItemProps) => (
  <TouchableOpacity
    style={[styles.menuItem, disabled && styles.disabledMenuItem]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.7}
  >
    <Ionicons
      name={iconName}
      size={24}
      color={disabled ? theme.colors.textMediumGrey : theme.colors.primary}
      style={styles.icon}
    />
    <Text style={[styles.menuItemText, disabled && styles.disabledText]}>
      {label}
    </Text>
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
  const { logout } = useGlobalStore();
  const [isNavigating, setIsNavigating] = useState(false);
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

  const handleNavigation = useCallback(
    (route: string) => {
      if (isNavigating) return;

      // Clear any existing timeout
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }

      setIsNavigating(true);
      props.navigation.closeDrawer();

      // Use requestAnimationFrame to ensure proper timing with React's render cycle
      navigationTimeoutRef.current = setTimeout(() => {
        try {
          router.push(route);
        } catch (error) {
          console.error("Navigation error:", error);
          Alert.alert(t("navigationError"), t("failedToNavigate"));
        } finally {
          // Use requestAnimationFrame to ensure state update happens after render
          requestAnimationFrame(() => {
            setIsNavigating(false);
          });
        }
      }, 300); // Reduced timeout for better UX
    },
    [router, props.navigation, isNavigating, t]
  );
  // Updated handleLogout with navigation state
  const handleLogout = useCallback(() => {
    if (isNavigating) return;

    Alert.alert(
      t("logout_confirmation_title"),
      t("logout_confirmation_message"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          onPress: async () => {
            setIsNavigating(true);
            try {
              await SecureStore.deleteItemAsync("user_mpin");
              logout();
              // Use requestAnimationFrame to ensure proper timing
              requestAnimationFrame(() => {
                router.replace("/(auth)/login");
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert(t("logoutError"), t("failedToLogout"));
            } finally {
              // Use requestAnimationFrame to ensure state update happens after render
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

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../../assets/images/logo_trans.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.menuContainer}>
          {/* User Account Section */}
          {/* <Text style={styles.sectionHeader}>User Account</Text> */}
          <DrawerMenuItem
            label={t("profile")}
            iconName="person-outline"
            onPress={() => handleNavigation("/(tabs)/profile")}
            disabled={isNavigating}
          />

          {/* Explore & Benefits Section */}
          {/* <Text style={styles.sectionHeader}>Explore & Benefits</Text> */}
          {/* <DrawerMenuItem
            label={t("offers")}
            iconName="flash-outline"
            onPress={() => handleNavigation("/(tabs)/home/offers")}
            disabled={isNavigating}
          /> */}
          <DrawerMenuItem
            label={t("referAndEarn")}
            iconName="gift-outline"
            onPress={() => handleNavigation("/(tabs)/home/refer_earn")}
            disabled={isNavigating}
          />

          {/* Store Information Section */}
          {/* <Text style={styles.sectionHeader}>Store Information</Text> */}
          <DrawerMenuItem
            label={t("ourStores")}
            iconName="location-outline"
            onPress={() => handleNavigation("/(tabs)/home/our_stores")}
            disabled={isNavigating}
          />
          {/* <DrawerMenuItem
            label={t("storeLocator")}
            iconName="location-outline"
            onPress={() => handleNavigation("/(tabs)/home/StoreLocator")}
            disabled={isNavigating}
          /> */}
          <DrawerMenuItem
            label={t("contactUs")}
            iconName="call-outline"
            onPress={() => handleNavigation("/(tabs)/home/contact_us")}
            disabled={isNavigating}
          />
          {/* <DrawerMenuItem
            label={t("aboutUs")}
            iconName="information-circle-outline"
            onPress={() => handleNavigation("/(tabs)/home/about_us")}
            disabled={isNavigating}
          /> */}
          <DrawerMenuItem
            label={t("faqAndHelp")}
            iconName="help-circle-outline"
            onPress={() => handleNavigation("/(tabs)/home/faq")}
            disabled={isNavigating}
          />

          {/* Legal & Policies Section */}
          {/* <Text style={styles.sectionHeader}>Legal & Policies</Text> */}
          {/* <DrawerMenuItem
            label={t("ourPolicies")}
            iconName="shield-checkmark-outline"
            onPress={() => handleNavigation("/(tabs)/home/policies/ourPolicies")}
            disabled={isNavigating}
          /> */}
          <DrawerMenuItem
            label={t("privacyPolicy")}
            iconName="lock-closed-outline"
            onPress={() =>
              handleNavigation("/(tabs)/home/policies/privacyPolicy")
            }
            disabled={isNavigating}
          />
          <DrawerMenuItem
            label={t("termsAndConditions")}
            iconName="newspaper-outline"
            onPress={() =>
              handleNavigation("/(tabs)/home/policies/termsAndConditionsPolicies")
            }
            disabled={isNavigating}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutButtonContainer}>
          <TouchableOpacity
            style={[styles.logoutButton, isNavigating && styles.disabledLogout]}
            onPress={handleLogout}
            disabled={isNavigating}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={
                isNavigating ? theme.colors.textLightGrey : theme.colors.white
              }
              style={styles.logoutIcon}
            />
            <Text
              style={[styles.logoutText, isNavigating && styles.disabledText]}
            >
              {t("logout")}
            </Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
      
      {/* Footer Section */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>v{version}</Text>
        <Text style={styles.copyrightText}>
          DC Jewellers. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

// Styles remain mostly the same with these additions:
const styles = StyleSheet.create({
  disabledText: {
    color: theme.colors.textMediumGrey,
  },
  disabledLogout: {
    backgroundColor: theme.colors.textLightGrey,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Reduced padding
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    borderTopRightRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  menuContainer: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: theme.colors.textDarkGrey,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  logoutButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: theme.colors.white,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  logoContainer: {
    width: width * 0.3,
    height: 50,
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  disabledMenuItem: {
    opacity: 0.5,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: theme.colors.textLightGrey,
  },
});

export default CustomDrawerContent;

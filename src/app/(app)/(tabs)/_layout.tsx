import { Tabs } from "expo-router";
import { StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NavigationErrorBoundary from "@/components/NavigationErrorBoundary";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSegments } from "expo-router";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import useGlobalStore from "@/store/global.store";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isTabVisible } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Check if we're on the schemes page
  const fullPath = segments.join("/");
  const isOnSchemesPage = fullPath.includes("home/schemes") || (segments.includes("schemes") && segments.includes("home"));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <NavigationErrorBoundary>
        <Tabs
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: theme.colors.primary, // Gold color for active tabs
            tabBarInactiveTintColor: theme.colors.primary,
            tabBarStyle: {
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
              backgroundColor: COLORS.white,
              borderTopWidth: 1,
              borderTopColor: COLORS.border?.primary || '#e5e5e5',
              display: isTabVisible ? 'flex' : 'none',
            },
            headerStyle: {
              backgroundColor: theme.colors.primary,
              height: Platform.OS === 'android' ? 60 : 60, // Reduced height for Android, larger for iOS (includes status bar)
              elevation: 0,
              shadowOpacity: 0,
            },
            headerStatusBarHeight: Platform.OS === 'ios' ? 0 : 0, // Let the safe area handle it or explicit height
            headerTitleContainerStyle: {
              paddingVertical: Platform.OS === 'android' ? 0 : undefined, // Remove vertical padding on Android to reduce height
            },
            headerLeftContainerStyle: {
              paddingLeft: Platform.OS === 'android' ? 4 : undefined, // Reduce left padding on Android
            },
            headerRightContainerStyle: {
              paddingRight: Platform.OS === 'android' ? 4 : undefined, // Reduce right padding on Android
            },
            headerTintColor: COLORS.white,
            headerTitleAlign: 'center', // Center align the header title
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: Platform.OS === 'android' ? 16 : 18, // Slightly smaller font on Android
            },
            headerShadowVisible: false,
            lazy: true,
            freezeOnBlur: false,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t("home") || "Home",
              tabBarIcon: ({ color, size, focused }) => {
                // Make home tab inactive when on schemes page
                const isActive = focused && !isOnSchemesPage;
                return (
                  <Ionicons
                    name={isActive ? "home" : "home-outline"}
                    size={size}
                    color={isActive ? theme.colors.primary : color}
                  />
                );
              },
              tabBarLabel: t("home") || "Home",
              headerShown: false, // Hide header on home page
            }}
          />
          <Tabs.Screen
            name="savings"
            options={{
              title: t("savings") || "Savings",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "wallet" : "wallet-outline"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: t("mySchemes") || "My Schemes",
              headerShown: false, // Hide header for savings tab
            }}
          />
          <Tabs.Screen
            name="schemes"
            options={{
              title: t("joinSchemes") || "Join Schemes",
              tabBarIcon: ({ color, size, focused }) => {
                // Make schemes tab appear active when on schemes page
                const isActive = focused || isOnSchemesPage;
                return (
                  <Ionicons
                    name={isActive ? "add-circle" : "add-circle-outline"}
                    size={size}
                    color={isActive ? theme.colors.primary : color}
                  />
                );
              },
              tabBarLabel: t("joinSchemes") || "Join Schemes",
            }}
          />
          <Tabs.Screen
            name="gold_advance"
            options={{
              href: null, // Hide from tab bar - this prevents Expo Router from auto-adding it
            }}
          />
          <Tabs.Screen
            name="notifications"
            // options={{
            //   title: t("notifications") || "Notifications",
            //   tabBarIcon: ({ color, size }) => (
            //     <Ionicons name="notifications-outline" size={size} color={color} />
            //   ),
            //   tabBarLabel: t("notifications") || "Notifications",
            // }}
            options={{
              title: t("notifications") || "Notifications",
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t("profile") || "Profile",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: t("profile") || "Profile",
            }}
          />

          <Tabs.Screen
            name="app_visibility"
            options={{
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="joinadvancegold"
            options={{
              href: null, // Hide from tab bar
            }}
          />
        </Tabs>
      </NavigationErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

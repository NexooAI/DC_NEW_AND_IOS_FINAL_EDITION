import { Tabs } from "expo-router";
import { StyleSheet, Platform, View, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import NavigationErrorBoundary from "@/components/NavigationErrorBoundary";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSegments, useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import useGlobalStore from "@/store/global.store";
import { BlurView } from "expo-blur";
import { useAppVisibility } from "@/hooks/useAppVisibility";

export default function TabsLayout() {
  const { t } = useTranslation();
  const { isTabVisible } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  const { isVisible } = useAppVisibility();

  // Check if we're on the schemes page
  const fullPath = segments.join("/");
  const isOnSchemesPage = fullPath.includes("home/schemes") || (segments.includes("schemes") && segments.includes("home"));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <NavigationErrorBoundary>
        <Tabs
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: theme.colors.primary || "#850111", // Primary active color
            tabBarInactiveTintColor: "#666", // Inactive grey
            tabBarBackground: () => (
              <BlurView
                tint="light"
                intensity={85}
                style={StyleSheet.absoluteFill}
              />
            ),
            tabBarStyle: {
              height: 60,
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.85)', // Light translucent base
              borderTopWidth: 1.5,
              borderTopColor: 'rgba(0, 0, 0, 0.1)', // Light border line
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.08,
              shadowRadius: 6,
              paddingBottom: Platform.OS === 'ios' ? 12 : 8,
              paddingTop: 8,
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
              href: isVisible("showTabHome") ? undefined : null,
              title: t("home") || "Home",
              tabBarIcon: ({ color, size, focused }) => {
                // Make home tab inactive when on schemes page
                const isActive = focused && !isOnSchemesPage;
                return (
                  <Ionicons
                    name={isActive ? "home" : "home-outline"}
                    size={size}
                    color={isActive ? color : (focused ? "#666" : color)}
                  />
                );
              },
              tabBarLabel: t("home") || "Home",
              headerShown: false, // Hide header on home page
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                if (navigation.isFocused()) {
                  e.preventDefault();
                } else {
                  e.preventDefault();
                  router.push("/(app)/(tabs)/home");
                }
              },
            })}
          />
          <Tabs.Screen
            name="savings"
            options={{
              href: isVisible("showTabSavings") ? undefined : null,
              title: t("schemes.title") || "Schemes",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "wallet" : "wallet-outline"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: t("schemes.title") || "Schemes",
              headerShown: false, // Hide header for savings tab
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                if (navigation.isFocused()) {
                  e.preventDefault();
                }
              },
            })}
          />
          <Tabs.Screen
            name="dashboard_tab"
            options={{
              title: t("dashboard") || "Dashboard",
              // Hide header because this is a fake tab
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "grid" : "grid-outline"}
                  size={size + 4}
                  color={color}
                />
              ),
              tabBarLabel: t("dashboard") || "Dashboard",
            }}
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                router.push("/(app)/dashboard");
              },
            })}
          />
          <Tabs.Screen
            name="quick_join"
            options={{
              href: isVisible("showTabQuickJoin") ? undefined : null,
              title: t("quickJoin") || "Quick Join",
              tabBarLabel: () => null,
              headerShown: false,
              tabBarIcon: ({ focused }) => (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    height: 60,
                    width: 60,
                    // Float the icon
                    marginBottom: 30, // Push it up
                    borderRadius: 30,
                    backgroundColor: theme.colors.bgWhite, // Ring border color
                    elevation: 5,
                    shadowColor: "#000",
                    shadowOpacity: 0.3,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 4,
                  }}
                >
                  <LinearGradient
                    colors={["#FFD700", "#FFA500"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      height: 50,
                      width: 50,
                      borderRadius: 25,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name="flash" size={26} color={COLORS.white} />
                  </LinearGradient>
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="rewards"
            options={{
              href: isVisible("showTabRewards") ? undefined : null,
              title: t("rewards") || "Rewards",
              tabBarIcon: ({ color, size, focused }) => {
                return (
                  <Ionicons
                    name={focused ? "gift" : "gift-outline"}
                    size={size}
                    color={color}
                  />
                );
              },
              tabBarLabel: t("rewards") || "Rewards",
              headerShown: false,
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                if (navigation.isFocused()) {
                  e.preventDefault();
                }
              },
            })}
          />
          <Tabs.Screen
            name="rewards_history"
            options={{
              href: null, // Hide completely from tab bar
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="notifications"
            options={{
              title: t("notifications") || "Notifications",
              href: null, // Hide from tab bar
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: isVisible("showTabProfile") ? undefined : null,
              title: t("profile") || "Profile",
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: t("profile") || "Profile",
              headerShown: false,
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                if (navigation.isFocused()) {
                  e.preventDefault();
                }
              },
            })}
          />

          <Tabs.Screen
            name="app_visibility"
            options={{
              href: null, // Hide from tab bar
            }}
          />
          <Tabs.Screen
            name="joinAdvGold"
            options={{
              href: null, // Hide from tab bar
              headerShown: false,
            }}
          />
        </Tabs>
      </NavigationErrorBoundary>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});

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
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { BlurView } from "expo-blur";
import CustomBottomBar from "@/common/components/navigation/CustomBottomBar";

export default function TabsLayout() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const { isTabVisible } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const router = useRouter();
  const hasDashboard = getAppConfig().constants.enableDashboard;

  // Check if we're on the schemes page
  const fullPath = segments.join("/");
  const isOnSchemesPage = fullPath.includes("home/schemes") || (segments.includes("schemes") && segments.includes("home"));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <NavigationErrorBoundary>
        <Tabs
          tabBar={(props) => <CustomBottomBar {...props} />}
          screenOptions={{
            headerShown: true,
            /*
            tabBarActiveTintColor: "#FFD700", // Gold color for active tabs
            tabBarInactiveTintColor: "#cbd5e1", // Light silver/grey for inactive tabs
            tabBarBackground: () => (
              <BlurView
                tint="dark"
                intensity={85}
                style={StyleSheet.absoluteFill}
              />
            ),
            tabBarStyle: {
              height: 60,
              overflow: 'hidden',
              backgroundColor: 'rgba(26, 2, 4, 0.90)', // Dark black-maroon base
              borderTopWidth: 1.5,
              borderTopColor: 'rgba(218, 165, 32, 0.25)', // Glowing gold top border line
              elevation: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              paddingBottom: Platform.OS === 'ios' ? 12 : 8,
              paddingTop: 8,
              display: isTabVisible ? 'flex' : 'none',
            },
            */
            tabBarStyle: {
              display: isTabVisible ? 'flex' : 'none',
            },
            headerStyle: {
              backgroundColor: theme.colors.primary,
              elevation: 0,
              shadowOpacity: 0,
            },
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
                    color={isActive ? color : (focused ? "#cbd5e1" : color)}
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
              href: hasDashboard ? undefined : null,
              title: t("dashboard") || "Dashboard",
              // Hide header because this is a fake tab
              headerShown: false,
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? "grid" : "grid-outline"}
                  size={size}
                  color={color}
                />
              ),
              tabBarLabel: t("dashboard") || "Dashboard",
            }}
            listeners={() => ({
              tabPress: (e) => {
                e.preventDefault();
                if (hasDashboard) {
                  router.push("/(app)/dashboard");
                }
              },
            })}
          />
          <Tabs.Screen
            name="quick_join"
            options={{
              href: null,
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

function getStyles(theme: any) { return StyleSheet.create({}) }

var styles = getStyles(theme);;

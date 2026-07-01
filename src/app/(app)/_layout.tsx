import { useAppTheme } from "@/store/global.store";
import { Text, Platform } from "react-native";
import CustomDrawerContent from "@/common/components/navigation/DrawerContent";
import { Drawer } from "expo-router/drawer";
import { useSegments } from "expo-router";
import React, { useCallback, useEffect } from "react";
import NavigationErrorBoundary from "@/components/NavigationErrorBoundary";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import FloatingChatButton from "@/components/FloatingChatButton";
import { logDeviceInfo } from "@/services/appEventService";
import { useAppVisibility } from "@/hooks/useAppVisibility";

// Disable global font scaling for Text components
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

export default function AppLayout() {
  const theme = useAppTheme();
  const { isVisible } = useAppVisibility();
  const segments = useSegments();

  useEffect(() => {
    logDeviceInfo();
  }, []);

  // Memoize drawer content to prevent unnecessary re-renders
  const renderDrawerContent = useCallback((props: any) => {
    return <CustomDrawerContent {...props} />;
  }, []);

  // Determine SafeAreaView backgroundColor dynamically based on active segment
  const isLightBarScreen = 
    segments.includes("home") ||
    segments.includes("profile") ||
    segments.includes("rewards") ||
    segments.includes("rewards_history") ||
    segments.includes("gold_advance") ||
    segments.includes("bill_payment") ||
    segments.includes("tickets") ||
    segments.includes("lucky_draw") ||
    segments.includes("old_gold") ||
    segments.includes("notifications") ||
    segments.includes("savings") ||
    segments.includes("payment-history");
  const safeAreaBackgroundColor = isLightBarScreen ? (theme.colors.quaternary || "#F2E6D2") : theme.colors.textDark;

  return (
    <SafeAreaProvider>
      <SafeAreaView 
        style={{ flex: 1, backgroundColor: safeAreaBackgroundColor }} 
        edges={Platform.OS === "ios" ? ["top", "left", "right"] : ["left", "right"]}
      >
        <NavigationErrorBoundary>
          <Drawer
            screenOptions={{
              headerShown: false,
              swipeEnabled: false, // Disable swipe gesture
              drawerType: "front", // Ensure drawer renders in front
              overlayColor: "rgba(0, 0, 0, 0.5)", // Add overlay for better UX
              drawerStyle: {
                width: "85%", // Set explicit width
              },
              // Add these options to prevent Fragment management issues
              drawerHideStatusBarOnOpen: false,
              drawerStatusBarAnimation: "slide",
              drawerActiveBackgroundColor: "transparent",
              drawerInactiveBackgroundColor: "transparent",
              // Prevent concurrent rendering issues
              freezeOnBlur: false,
              // Optimize drawer performance
              drawerPosition: "left",
            }}
            drawerContent={renderDrawerContent}
          >
            <Drawer.Screen
              name="dashboard"
              options={{
                lazy: true,
                freezeOnBlur: false,
                drawerLabel: "Dashboard",
                title: "Dashboard",
              }}
            />
            <Drawer.Screen
              name="(tabs)"
              options={{
                // Enable lazy loading for better performance
                lazy: true,
                // Ensure proper screen management
                // Note: unmountOnBlur is not available for Drawer screens
                // Prevent concurrent rendering issues
                freezeOnBlur: false,
              }}
            />
            <Drawer.Screen
              name="lucky_draw"
              options={{
                lazy: true,
                freezeOnBlur: false,
                drawerLabel: "Lucky Draw",
                title: "Lucky Draw",
                drawerItemStyle: { display: 'none' } // Hide from drawer menu but keep as valid route
              }}
            />
          </Drawer>
        </NavigationErrorBoundary>
      </SafeAreaView>
      {isVisible("showLiveChatBox") && <FloatingChatButton />}
    </SafeAreaProvider>
  );
}

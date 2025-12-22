import { Text } from "react-native";
import CustomDrawerContent from "@/common/components/navigation/DrawerContent";
import { Drawer } from "expo-router/drawer";
import React, { useCallback } from "react";
import NavigationErrorBoundary from "@/components/NavigationErrorBoundary";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

// Disable global font scaling for Text components
(Text as any).defaultProps = {
  ...(Text as any).defaultProps,
  allowFontScaling: false,
};

export default function AppLayout() {
  // Memoize drawer content to prevent unnecessary re-renders
  const renderDrawerContent = useCallback((props: any) => {
    return <CustomDrawerContent {...props} />;
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.primary }} edges={["top", "left", "right"]}>
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
          </Drawer>
        </NavigationErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

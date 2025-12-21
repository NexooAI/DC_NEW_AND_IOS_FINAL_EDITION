import React from "react";
import { View, StyleSheet } from "react-native";
import {
  SafeAreaView,
  SafeAreaProvider,
} from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showBottomBar?: boolean;
  headerProps?: {
    showBackButton?: boolean;
    showMenu?: boolean;
    backRoute?: string;
    showLanguageSwitcher?: boolean;
    goldRateInfo?: {
      rate: string;
      purity: string;
    };
    goldRateUpdatedAt?: string;
    title?: string;
  };
}

const AppLayoutWrapper: React.FC<AppLayoutWrapperProps> = ({
  children,
}) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.container}>
          {/* Global Status Bar - managed centrally with default values */}

          {/* Content Area - Using default React Navigation header and tab bar */}
          <View style={styles.contentContainer}>
            {children}
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
});

export default AppLayoutWrapper;

import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import {
  useDrawerScreen,
  useDrawerScreenState,
  useDrawerAuthState,
} from "@/hooks/useDrawerScreen";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import Loader from "@/components/Loader";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";
import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";

interface DrawerScreenTemplateProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
  showMenu?: boolean;
  showLanguageSwitcher?: boolean;
  backRoute?: string;
  hideBottomBar?: boolean;
  loadingMessage?: string;
  loginPromptMessage?: string;
  onRetry?: () => void;
}

/**
 * Template component for drawer screens that ensures hook consistency
 * This component demonstrates the proper pattern for drawer screen components
 */
export default function DrawerScreenTemplate({
  children,
  title,
  showBackButton = true,
  showMenu = true,
  showLanguageSwitcher = true,
  backRoute,
  hideBottomBar = false,
  loadingMessage,
  loginPromptMessage,
  onRetry,
}: DrawerScreenTemplateProps) {
  // ALL HOOKS CALLED AT TOP LEVEL - No exceptions
  const { t } = useDrawerScreen({
    title,
    showBackButton,
    showMenu,
    showLanguageSwitcher,
    backRoute,
    hideBottomBar,
  });

  const { isLoading, error, setLoading, setErrorState, resetState } =
    useDrawerScreenState();
  const { isUserAuthenticated, showLoginPrompt } = useDrawerAuthState();
  const { user } = useGlobalStore();

  // Additional hooks for screen-specific logic
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Data fetching effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorState(null);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setData({ message: "Data loaded successfully" });
      } catch (err) {
        setErrorState("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    if (isUserAuthenticated) {
      fetchData();
    }
  }, [isUserAuthenticated, setLoading, setErrorState]);

  // Handle retry
  const handleRetry = useCallback(() => {
    resetState();
    if (onRetry) {
      onRetry();
    }
  }, [resetState, onRetry]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  // Conditional rendering based on state - NO early returns after hooks
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Loader
          visible={isLoading}
          message={loadingMessage || t("loading")}
          type="fullscreen"
          size="large"
          overlay={true}
        />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.error} />
        <ResponsiveText
          variant="body"
          size="md"
          color={COLORS.text.primary}
          align="center"
          style={styles.errorText}
        >
          {error}
        </ResponsiveText>
        <ResponsiveButton
          title={t("retry")}
          variant="primary"
          size="lg"
          onPress={handleRetry}
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (showLoginPrompt) {
    return (
      <View style={styles.loginContainer}>
        <Ionicons
          name="person-circle-outline"
          size={60}
          color={COLORS.secondary}
        />
        <ResponsiveText
          variant="body"
          size="md"
          color={COLORS.white}
          align="center"
          style={styles.loginText}
        >
          {loginPromptMessage || t("pleaseLoginToViewDashboard")}
        </ResponsiveText>
        <ResponsiveButton
          title={t("goToLogin")}
          variant="primary"
          size="lg"
          onPress={() => {
            // Navigation logic here
          }}
          style={styles.loginButton}
        />
      </View>
    );
  }

  // Main content - all hooks have been called
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.background.primary,
  },
  errorText: {
    marginVertical: 20,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.primary,
  },
  loginText: {
    marginVertical: 20,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 20,
  },
});

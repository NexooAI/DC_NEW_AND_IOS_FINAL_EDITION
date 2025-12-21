import React from "react";
import { View, StyleSheet, RefreshControl, ScrollView } from "react-native";
import {
  useDynamicVisibility,
  VisibilityConfig,
} from "@/hooks/useDynamicVisibility";
import Loader from "./Loader";
import ResponsiveText from "./ResponsiveText";
import ResponsiveButton from "./ResponsiveButton";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

// Component mapping type for better type safety
export interface ComponentMap {
  [key: string]: React.ReactNode;
}

// Props interface
export interface DynamicVisibilityWrapperProps {
  // API configuration
  apiEndpoint?: string;
  autoFetch?: boolean;

  // Component mapping - maps visibility keys to React components
  components: ComponentMap;

  // Loading configuration
  loadingMessage?: string;
  showLoadingOverlay?: boolean;

  // Error handling
  showErrorRetry?: boolean;
  errorMessage?: string;

  // Refresh configuration
  enableRefresh?: boolean;
  refreshMessage?: string;

  // Container styling
  containerStyle?: any;
  contentStyle?: any;

  // Custom render functions
  renderLoading?: () => React.ReactNode;
  renderError?: (error: string, onRetry: () => void) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;

  // Children to render when no visibility config is available
  fallbackChildren?: React.ReactNode;
}

/**
 * DynamicVisibilityWrapper - A reusable component for conditionally rendering components based on API visibility configuration
 *
 * Features:
 * - Automatically fetches visibility configuration from API
 * - Conditionally renders components based on 1/0 values
 * - Built-in loading and error states
 * - Pull-to-refresh functionality
 * - Customizable rendering functions
 * - Type-safe component mapping
 *
 * Usage:
 * ```tsx
 * <DynamicVisibilityWrapper
 *   apiEndpoint="/visibility-config"
 *   components={{
 *     showGoldRate: <GoldRateComponent />,
 *     showSilverRate: <SilverRateComponent />,
 *     showCollection: <CollectionComponent />,
 *     // ... more components
 *   }}
 *   loadingMessage="Loading components..."
 *   enableRefresh={true}
 * />
 * ```
 */
const DynamicVisibilityWrapper: React.FC<DynamicVisibilityWrapperProps> = ({
  apiEndpoint = "/visibility-config",
  autoFetch = true,
  components,
  loadingMessage = "Loading components...",
  showLoadingOverlay = true,
  showErrorRetry = true,
  errorMessage,
  enableRefresh = true,
  refreshMessage = "Pull to refresh",
  containerStyle,
  contentStyle,
  renderLoading,
  renderError,
  renderEmpty,
  fallbackChildren,
}) => {
  // Hook for managing visibility
  const { visibilityConfig, isLoading, error, refreshConfig, isVisible } =
    useDynamicVisibility(apiEndpoint, autoFetch);

  // Responsive layout hook
  const { screenWidth, deviceScale } = useResponsiveLayout();

  // Handle refresh
  const handleRefresh = async () => {
    await refreshConfig();
  };

  // Render loading state
  const renderLoadingState = () => {
    if (renderLoading) {
      return renderLoading();
    }

    if (showLoadingOverlay) {
      return (
        <Loader
          visible={isLoading}
          message={loadingMessage}
          type="fullscreen"
          size="large"
          overlay={true}
        />
      );
    }

    return (
      <View style={styles.loadingContainer}>
        <Loader
          visible={isLoading}
          message={loadingMessage}
          type="inline"
          size="medium"
          overlay={false}
        />
      </View>
    );
  };

  // Render error state
  const renderErrorState = () => {
    if (renderError) {
      return renderError(error || "Unknown error", handleRefresh);
    }

    return (
      <View style={styles.errorContainer}>
        <ResponsiveText style={styles.errorText}>
          {errorMessage || error || "Failed to load component configuration"}
        </ResponsiveText>

        {showErrorRetry && (
          <ResponsiveButton
            title="Retry"
            onPress={handleRefresh}
            style={styles.retryButton}
            textColor={COLORS.white}
          />
        )}
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (renderEmpty) {
      return renderEmpty();
    }

    return (
      <View style={styles.emptyContainer}>
        <ResponsiveText style={styles.emptyText}>
          No components available
        </ResponsiveText>
      </View>
    );
  };

  // Render visible components
  const renderVisibleComponents = () => {
    if (!visibilityConfig) {
      return fallbackChildren || renderEmptyState();
    }

    const visibleComponents: React.ReactNode[] = [];

    // Iterate through all components and check visibility
    Object.entries(components).forEach(([key, component]) => {
      // Type assertion to ensure key is valid
      const visibilityKey = key as keyof Omit<
        VisibilityConfig,
        "id" | "updated_at"
      >;

      if (isVisible(visibilityKey) && component) {
        visibleComponents.push(
          <View key={key} style={styles.componentWrapper}>
            {component}
          </View>
        );
      }
    });

    if (visibleComponents.length === 0) {
      return renderEmptyState();
    }

    return visibleComponents;
  };

  // Main render logic
  if (isLoading && !visibilityConfig) {
    return renderLoadingState();
  }

  if (error && !visibilityConfig) {
    return renderErrorState();
  }

  // Main content with optional refresh control
  const content = (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.content, contentStyle]}>
        {renderVisibleComponents()}
      </View>
    </View>
  );

  if (enableRefresh) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            title={refreshMessage}
            tintColor={COLORS.primary}
            titleColor={COLORS.text.primary}
          />
        }
      >
        {content}
      </ScrollView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  componentWrapper: {
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: COLORS.grey,
    textAlign: "center",
    fontSize: 16,
  },
});

export default DynamicVisibilityWrapper;

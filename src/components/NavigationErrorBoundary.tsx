import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { theme } from "@/constants/theme";

import { logger } from "@/utils/logger";
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorCount: number;
}

export class NavigationErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if it's a concurrent rendering error
    const isConcurrentError =
      error.message.includes("concurrent rendering") ||
      error.message.includes("There was an error during concurrent rendering");

    logger.error("Navigation Error Boundary caught an error:", error);

    return {
      hasError: true,
      error,
      errorCount: 0, // Reset error count for new errors
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error(
      "Navigation Error Boundary caught an error:",
      error,
      errorInfo
    );

    // If it's a concurrent rendering error, try to recover automatically
    if (
      error.message.includes("concurrent rendering") ||
      error.message.includes("There was an error during concurrent rendering")
    ) {
      logger.info(
        "Concurrent rendering error detected, attempting auto-recovery..."
      );

      // Auto-recovery after a short delay
      this.retryTimeout = setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.setState({ hasError: false, error: undefined, errorCount: 0 });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isConcurrentError =
        this.state.error?.message.includes("concurrent rendering") ||
        this.state.error?.message.includes(
          "There was an error during concurrent rendering"
        );

      return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {isConcurrentError ? "Navigation Recovery" : "Navigation Error"}
          </Text>
          <Text style={styles.message}>
            {isConcurrentError
              ? "React detected a concurrent rendering issue and is recovering automatically. This usually resolves itself quickly."
              : "Something went wrong with the navigation. This usually happens when there are Fragment management conflicts or navigation state issues."}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>
              {isConcurrentError ? "Continue" : "Try Again"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default NavigationErrorBoundary;

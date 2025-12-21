import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";
import { logger } from "@/utils/logger";
import api from "@/services/api";

// Type definition for the API response
interface AppVisibilityData {
  id: number;
  showGoldRate: number;
  showSilverRate: number;
  showCollection: number;
  showPoster: number;
  showFlashnews: number;
  showCustomerCard: number;
  showSchemes: number;
  showFlexiScheme: number;
  showFixedScheme: number;
  showDailyScheme: number;
  showWeeklyScheme: number;
  showMonthlyScheme: number;
  showSocialMedia: number;
  showSupportCard: number;
  showHallmark: number;
  showLiveChatBox: number;
  showTranslate: number;
  showYoutube: number;
  showSchemsPage: number;
  updated_at: string;
}

export default function AppVisibilityScreen() {
  const { t } = useTranslation();
  const [visibleData, setVisibleData] = useState<AppVisibilityData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch visibility data from API
  const fetchVisibilityData = useCallback(async (isRefreshing = false) => {
    try {
      logger.log("🔍 Fetching app visibility data...");

      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setError(null);

      const response = await api.get("/app-visible");

      if (response.data) {
        setVisibleData(response.data);
        logger.log(
          "✅ App visibility data fetched successfully:",
          response.data
        );
      } else {
        throw new Error("No data received from API");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to fetch visibility data";
      setError(errorMessage);
      logger.error("❌ Error fetching app visibility data:", errorMessage);

      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchVisibilityData();
  }, [fetchVisibilityData]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    fetchVisibilityData(true);
  }, [fetchVisibilityData]);

  // Loading indicator
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            Loading app visibility settings...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && !visibleData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.retryText} onPress={() => fetchVisibilityData()}>
            Tap to retry
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>App Visibility Settings</Text>
          <Text style={styles.subtitle}>
            Last updated:{" "}
            {visibleData?.updated_at
              ? new Date(visibleData.updated_at).toLocaleString()
              : "Unknown"}
          </Text>

          {/* Conditionally render components based on API response */}
          <View style={styles.componentsContainer}>
            {/* Gold Rate Component */}
            {visibleData?.showGoldRate === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Gold Rate Component</Text>
                <Text style={styles.componentDescription}>
                  This component shows current gold rates
                </Text>
              </View>
            )}

            {/* Silver Rate Component */}
            {visibleData?.showSilverRate === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Silver Rate Component</Text>
                <Text style={styles.componentDescription}>
                  This component shows current silver rates
                </Text>
              </View>
            )}

            {/* Collection Component */}
            {visibleData?.showCollection === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Collection Component</Text>
                <Text style={styles.componentDescription}>
                  This component displays jewelry collections
                </Text>
              </View>
            )}

            {/* Poster Component */}
            {visibleData?.showPoster === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Poster Component</Text>
                <Text style={styles.componentDescription}>
                  This component shows promotional posters
                </Text>
              </View>
            )}

            {/* Flash News Component */}
            {visibleData?.showFlashnews === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Flash News Component</Text>
                <Text style={styles.componentDescription}>
                  This component displays breaking news
                </Text>
              </View>
            )}

            {/* Customer Card Component */}
            {visibleData?.showCustomerCard === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Customer Card Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component shows customer information
                </Text>
              </View>
            )}

            {/* Schemes Component */}
            {visibleData?.showSchemes === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Schemes Component</Text>
                <Text style={styles.componentDescription}>
                  This component displays available schemes
                </Text>
              </View>
            )}

            {/* Flexi Scheme Component */}
            {visibleData?.showFlexiScheme === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Flexi Scheme Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component shows flexible schemes
                </Text>
              </View>
            )}

            {/* Fixed Scheme Component */}
            {visibleData?.showFixedScheme === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Fixed Scheme Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component displays fixed schemes
                </Text>
              </View>
            )}

            {/* Daily Scheme Component */}
            {visibleData?.showDailyScheme === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Daily Scheme Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component shows daily schemes
                </Text>
              </View>
            )}

            {/* Weekly Scheme Component */}
            {visibleData?.showWeeklyScheme === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Weekly Scheme Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component displays weekly schemes
                </Text>
              </View>
            )}

            {/* Monthly Scheme Component */}
            {visibleData?.showMonthlyScheme === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Monthly Scheme Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component shows monthly schemes
                </Text>
              </View>
            )}

            {/* Social Media Component */}
            {visibleData?.showSocialMedia === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Social Media Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component displays social media links
                </Text>
              </View>
            )}

            {/* Support Card Component */}
            {visibleData?.showSupportCard === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Support Card Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component shows customer support information
                </Text>
              </View>
            )}

            {/* Hallmark Component */}
            {visibleData?.showHallmark === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Hallmark Component</Text>
                <Text style={styles.componentDescription}>
                  This component displays hallmark information
                </Text>
              </View>
            )}

            {/* Live Chat Box Component */}
            {visibleData?.showLiveChatBox === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>
                  Live Chat Box Component
                </Text>
                <Text style={styles.componentDescription}>
                  This component provides live chat functionality
                </Text>
              </View>
            )}

            {/* Translate Component */}
            {visibleData?.showTranslate === 1 && (
              <View style={styles.componentCard}>
                <Text style={styles.componentTitle}>Translate Component</Text>
                <Text style={styles.componentDescription}>
                  This component provides translation functionality
                </Text>
              </View>
            )}

            {/* Show message if no components are visible */}
            {visibleData &&
              Object.values(visibleData).every(
                (value, index) =>
                  index < Object.keys(visibleData).length - 2 && value === 0
              ) && (
                <View style={styles.noComponentsCard}>
                  <Text style={styles.noComponentsText}>
                    No components are currently visible based on the app
                    visibility settings.
                  </Text>
                </View>
              )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  componentsContainer: {
    gap: 12,
  },
  componentCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  componentTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  componentDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  noComponentsCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    alignItems: "center",
  },
  noComponentsText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: theme.colors.primary,
    textDecorationLine: "underline",
  },
});

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { useTranslation } from "@/hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";

import { logger } from '@/utils/logger';
const { width, height } = Dimensions.get("window");

export default function TermsAndConditions() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();

  // State for storing policy data, loading state, and errors
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Fetch policy data on component mount
  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        api
          .get("/policies/type/terms_and_conditions")
          .then((response: any) => {
            setPolicy(response.data.data);
            //logger.log("Terms and Conditions loaded successfully:", response.data.data);
          })
          .catch((err: any) => {
            logger.error("Error fetching Terms and Conditions:", err);
            throw new Error("Policy data not found");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        logger.error("Error in fetchPolicy:", err);
        setError(err);
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  // Function to retry fetching policy data
  const retryFetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/policies/type/terms_and_conditions");
      setPolicy(response.data.data);
      //logger.log("Terms and Conditions retried and loaded successfully:", response.data.data);
    } catch (err: any) {
      logger.error("Error retrying Terms and Conditions:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fallback translations in case API data is missing
  const translations = useMemo(
    () => ({
      defaultTitle: t("termsAndConditionsTitle"), // e.g., "Terms & Conditions"
      defaultContent: t("termsAndConditionsContent"), // default short terms text
      defaultDiscription: t("termsAndConditionsDiscription"), // default long terms text
    }),
    [language]
  );


  // Render loading state
  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.support_container[1]]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#FFD700" />
      </LinearGradient>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={["#850111", "#5a000b"]}
        style={styles.errorGradient}
      >
        <Ionicons name="alert-circle-outline" size={60} color="#FFD700" />
        <Text style={styles.errorTitle}>{t("oopsSomethingWentWrong")}</Text>
        <Text style={styles.errorText}>
          {t("errorLoadingPolicy")} {error.message}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryFetchPolicy}>
          <Text style={styles.retryButtonText}>{t("tryAgain")}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Render main content
  const renderMainContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ImageBackground
        source={require("../../../../../../assets/images/bg_new.jpg")}
        style={styles.backgroundImage}
        resizeMode="contain"
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Hero Section */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.support_container[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroSection}
          >
            <View style={styles.heroContent}>
              <View style={{ marginTop: 20 }}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color="#FFD700"
                />
              </View>
              <Text style={styles.heroTitle}>
                {policy?.title || translations.defaultTitle}
              </Text>
              <View style={styles.decorativeLine} />
            </View>
          </LinearGradient>

          {/* Content Section */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 20) + 20 }, // Reduced padding since no tab bar
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.95)",
                  "rgba(255, 255, 255, 0.85)",
                ]}
                style={styles.cardGradient}
              >
                <View style={styles.contentHeader}>
                  <Ionicons name="shield-checkmark" size={24} color="#850111" />
                  <Text style={styles.contentHeaderText}>
                    {t("ourCommitmentToYou")}
                  </Text>
                </View>

                <Text style={styles.contentText}>
                  {translations.defaultDiscription}
                </Text>

                {/* Service Terms Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color="#850111"
                    />
                    <Text style={styles.sectionTitle}>{t("serviceTerms")}</Text>
                  </View>
                  <Text style={styles.sectionText}>
                    {t("serviceTermsDescription")}
                  </Text>
                </View>

                {/* User Responsibilities Section */}
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color="#850111" />
                    <Text style={styles.sectionTitle}>
                      {t("userResponsibilities")}
                    </Text>
                  </View>
                  <Text style={styles.sectionText}>
                    {t("userResponsibilitiesDescription")}
                  </Text>
                </View>

                {/* Contact Section */}
                <View style={styles.contactSection}>
                  <LinearGradient
                    colors={[
                      theme.colors.primary,
                      theme.colors.support_container[1],
                    ]}
                    style={styles.contactGradient}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color="#FFD700"
                    />
                    <Text style={styles.contactTitle}>
                      {t("questionsAboutTerms")}
                    </Text>
                    <Text style={styles.contactText}>
                      {t("contactForClarification")}
                    </Text>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      {loading
        ? renderLoadingState()
        : error
        ? renderErrorState()
        : renderMainContent()}
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 12,
    fontFamily: "serif",
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardGradient: {
    padding: 24,
  },
  contentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  contentHeaderText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#850111",
    marginLeft: 12,
  },
  contentText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    letterSpacing: 0.3,
    marginBottom: 24,
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(133, 1, 17, 0.05)",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#850111",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#850111",
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 14,
    color: "#555555",
    lineHeight: 20,
  },
  contactSection: {
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  contactGradient: {
    padding: 20,
    alignItems: "center",
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
  },
  errorGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: "#FFD700",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#850111",
    fontSize: 16,
    fontWeight: "600",
  },
});

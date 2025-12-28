import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api from "@/services/api";
import { theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function TermsAndConditions() {
  const { t } = useTranslation();
  const router = useRouter();
  const { language } = useGlobalStore();

  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        setError(null);
        api
          .get("/policies/type/terms_and_conditions")
          .then((response: any) => {
            setPolicy(response.data.data);
          })
          .catch((err: any) => {
            throw new Error("Policy data not found");
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err: any) {
        setError(err);
        setLoading(false);
      }
    };

    fetchPolicy();
  }, []);

  const retryFetchPolicy = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/policies/type/terms_and_conditions");
      setPolicy(response.data.data);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const translations = useMemo(
    () => ({
      defaultTitle: t("termsAndConditionsTitle"),
      defaultContent: t("termsAndConditionsContent"),
      defaultDiscription: t("termsAndConditionsDiscription"),
    }),
    [language]
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.support_container[1]]}
        style={styles.loadingGradient}
      >
        <ActivityIndicator size="large" color="#FFD700" />
      </LinearGradient>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <LinearGradient
        colors={["#850111", "#5a000b"]}
        style={styles.errorGradient}
      >
        <Ionicons name="alert-circle-outline" size={60} color="#FFD700" />
        <Text style={styles.errorTitle}>{t("oopsSomethingWentWrong")}</Text>
        <Text style={styles.errorText}>
          {t("errorLoadingPolicy")} {error?.message}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryFetchPolicy}>
          <Text style={styles.retryButtonText}>{t("tryAgain")}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderMainContent = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        {/* Hero Section */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primary_dark || "#5a000b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="document-text-outline"
                size={36}
                color="white"
              />
            </View>
            <Text style={styles.heroTitle}>
              {policy?.title || translations.defaultTitle}
            </Text>
            <Text style={styles.heroSubtitle}>{t("ourCommitmentToYou")}</Text>
          </View>
        </LinearGradient>

        {/* Content Section */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Commitment Card - Overlaps Hero */}
          <View style={[styles.card, styles.introCard]}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>
                {t("ourCommitmentToYou")}
              </Text>
            </View>
            <Text style={styles.cardText}>
              {translations.defaultDiscription}
            </Text>
          </View>

          {/* Service Terms Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name="business-outline"
                size={22}
                color={theme.colors.primary}
              />
              <Text style={styles.cardTitle}>{t("serviceTerms")}</Text>
            </View>
            <Text style={styles.cardText}>
              {t("serviceTermsDescription")}
            </Text>
          </View>

          {/* User Responsibilities Section */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>
                {t("userResponsibilities")}
              </Text>
            </View>
            <Text style={styles.cardText}>
              {t("userResponsibilitiesDescription")}
            </Text>
          </View>

          {/* Contact Section */}
          <View style={styles.contactCard}>
            <Ionicons
              name="help-circle-outline"
              size={32}
              color="rgba(255, 255, 255, 0.9)"
            />
            <Text style={styles.contactTitle}>
              {t("questionsAboutTerms")}
            </Text>
            <Text style={styles.contactText}>
              {t("contactForClarification")}
            </Text>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <View style={{ flex: 1 }}>
        {loading
          ? renderLoadingState()
          : error
          ? renderErrorState()
          : renderMainContent()}
      </View>
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroContent: {
    alignItems: "center",
    paddingBottom: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  // New Card Styles
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: 10,
  },
  cardText: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  introCard: {
    marginTop: -24,
  },
  contactCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginTop: 10,
    marginBottom: 6,
  },
  contactText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: width * 0.8,
  },
  errorTitle: {
    color: "#FFD700",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 15,
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

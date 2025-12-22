import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Animated,
  ImageBackground,
  Platform,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";

import { logger } from "@/utils/logger";
const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth * 0.8;
const CARD_HEIGHT = 320; // Increased height for better spacing
const CARD_MARGIN = 16;

interface ApiScheme {
  SCHEMEID: number;
  SCHEMENAME: string | { en: string; ta: string };
  DESCRIPTION: string | { en: string; ta: string };
  BENEFITS?: string[];
  TYPE?: "weight" | "amount" | "flexible";
  SLOGAN?: string | { en: string; ta: string };
  MINAMOUNT?: string;
  MAXAMOUNT?: string;
  DURATION?: string;
  RETURNS?: string;
  ICON?: string;
  JOININGPROCEDURE?: string[];
  DETAILEDDESCRIPTION?: string | { en: string; ta: string };
  ELIGIBILITY?: string[];
  DOCUMENTS?: string[];
}

interface StaticSchemesHorizontalScrollProps {
  onSchemePress?: (scheme: ApiScheme) => void;
  showViewAll?: boolean;
}

export default function StaticSchemesHorizontalScroll({
  onSchemePress,
  showViewAll = true,
}: StaticSchemesHorizontalScrollProps) {
  const { t, locale } = useTranslation();
  const [selectedScheme, setSelectedScheme] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSchemeForModal, setSelectedSchemeForModal] =
    useState<ApiScheme | null>(null);
  const [schemes, setSchemes] = useState<ApiScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  // Fetch schemes from API with cache
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError(null);
        const { fetchSchemesWithCache } = await import("@/utils/apiCache");
        const schemesData = await fetchSchemesWithCache();
        if (schemesData && Array.isArray(schemesData)) {
          setSchemes(schemesData);
        } else {
          setSchemes([]);
        }
      } catch (err) {
        console.error("Error fetching schemes:", err);
        setError("Failed to load schemes");
        setSchemes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // Helper function to safely extract text from multilingual objects
  const getLocalizedText = (textObj: any): string => {
    if (!textObj) return "";

    // Handle strings
    if (typeof textObj === "string") return textObj;

    // Handle numbers
    if (typeof textObj === "number") return textObj.toString();

    // Handle objects with en/ta keys
    if (typeof textObj === "object" && textObj !== null) {
      if ("en" in textObj || "ta" in textObj) {
        return locale === "ta"
          ? textObj.ta || textObj.en || ""
          : textObj.en || textObj.ta || "";
      }

      // Handle arrays
      if (Array.isArray(textObj)) {
        return textObj.join(", ");
      }

      // Handle other objects - convert to string safely
      try {
        return JSON.stringify(textObj);
      } catch {
        return "[Object]";
      }
    }

    // Fallback for any other type
    return String(textObj);
  };

  // Handle status bar visibility when modal opens/closes
  useEffect(() => {
    if (modalVisible) {

    }
  }, [modalVisible]);

  // All scheme data is now fetched from API

  const handleSchemePress = async (scheme: ApiScheme) => {
    try {
      // Store scheme data for join page
      const schemeDataToStore = {
        schemeId: scheme.SCHEMEID,
        name: getLocalizedText(scheme.SCHEMENAME),
        description: getLocalizedText(scheme.DESCRIPTION),
        type: scheme.TYPE || "flexible",
        benefits: scheme.BENEFITS || [],
        minAmount: scheme.MINAMOUNT || "₹100",
        maxAmount: scheme.MAXAMOUNT || "No limit",
        duration: scheme.DURATION || "12 months",
        returns: scheme.RETURNS || "Gold",
        schemeType: (scheme.TYPE === "flexible" || !scheme.TYPE) ? "flexi" : "fixed",
        timestamp: new Date().toISOString(),
      };

      await AsyncStorage.setItem(
        "@current_scheme_data",
        JSON.stringify(schemeDataToStore)
      );

      if (onSchemePress) {
        onSchemePress(scheme);
      } else {
        router.push({
          pathname: "/home/join_savings",
          params: {
            schemeId: scheme.SCHEMEID.toString(),
          },
        });
      }
    } catch (error) {
      logger.error("Error handling scheme press:", error);
    }
  };

  const handleInfoPress = (scheme: ApiScheme) => {
    setSelectedSchemeForModal(scheme);
    setModalVisible(true);
  };

  const getSchemeGradient = (schemeType: string): [string, string, string] => {
    switch (schemeType) {
      case "weight":
        return ["#667eea", "#764ba2", "#f093fb"]; // Purple gradient
      case "amount":
        return ["#4ECDC4", "#44A08D", "#2E8B57"]; // Green gradient
      case "flexible":
        return ["#FFD93D", "#FFB347", "#FF8C42"]; // Orange gradient
      default:
        return ["#667eea", "#764ba2", "#f093fb"];
    }
  };

  const getSchemeImage = (schemeType: string) => {
    switch (schemeType) {
      case "weight":
        return require("../../assets/images/scheme1.jpg");
      case "amount":
        return require("../../assets/images/scheme2.jpg");
      case "flexible":
        return require("../../assets/images/scheme3.jpg");
      default:
        return require("../../assets/images/scheme1.jpg");
    }
  };

  const getSchemeIcon = (schemeType: string): string => {
    switch (schemeType) {
      case "weight":
        return "gift";
      case "amount":
        return "diamond";
      case "flexible":
        return "phone-portrait";
      default:
        return "diamond";
    }
  };

  const renderSchemeCard = ({
    item,
    index,
  }: {
    item: ApiScheme;
    index: number;
  }) => {
    const isSelected = selectedScheme === item.SCHEMEID;
    const gradientColors = getSchemeGradient(item.TYPE || "flexible");
    const schemeIcon = getSchemeIcon(item.TYPE || "flexible");
    const schemeImage = getSchemeImage(item.TYPE || "flexible");

    return (
      <Animated.View
        style={[
          styles.cardContainer,
          {
            transform: [{ scale: isSelected ? 1.05 : 1 }],
          },
        ]}
      >
        <View style={styles.card}>
          <ImageBackground
            source={schemeImage}
            style={styles.cardBackground}
            imageStyle={styles.backgroundImage}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.schemeTypeContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={schemeIcon as any} size={20} color="#fff" />
                  </View>
                  <Text style={styles.schemeType}>
                    {(item.TYPE || "flexible") === "weight"
                      ? "Bonus Scheme"
                      : (item.TYPE || "flexible") === "amount"
                      ? "Gold Scheme"
                      : "Mobi Gold"}
                  </Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>
                    {(item.TYPE || "flexible") === "flexible"
                      ? t("flexi")
                      : t("fixed")}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <Text style={styles.schemeName} numberOfLines={2}>
                  {getLocalizedText(item.SCHEMENAME)}
                </Text>
                <Text style={styles.slogan} numberOfLines={1}>
                  {getLocalizedText(item.SLOGAN)}
                </Text>
                <Text style={styles.description} numberOfLines={2}>
                  {getLocalizedText(item.DESCRIPTION)}
                </Text>
              </View>

              {/* Scheme Details */}
              <View style={styles.schemeDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t("amountRange")}</Text>
                    <Text style={styles.detailValue}>
                      {item.MINAMOUNT || "₹100"} -{" "}
                      {item.MAXAMOUNT || "No limit"}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t("duration")}</Text>
                    <Text style={styles.detailValue}>
                      {item.DURATION || "12 months"}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t("returns")}</Text>
                    <Text style={styles.detailValue}>
                      {item.RETURNS || "Gold"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.benefitsPreview}>
                  {(item.BENEFITS || []).slice(0, 2).map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#fff"
                      />
                      <Text style={styles.benefitText} numberOfLines={1}>
                        {benefit}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.infoButtonFooter}
                    onPress={() => handleInfoPress(item)}
                  >
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.infoButtonText}>{t("info")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => handleSchemePress(item)}
                  >
                    <Text style={styles.joinButtonText}>{t("joinNow")}</Text>
                    <Ionicons name="arrow-forward" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
      </Animated.View>
    );
  };

  const renderModal = () => (
    <Modal
      visible={modalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setModalVisible(false)}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedSchemeForModal && (
            <>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View
                    style={[
                      styles.modalIconContainer,
                      {
                        backgroundColor: getSchemeGradient(
                          selectedSchemeForModal.TYPE || "flexible"
                        )[0],
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        getSchemeIcon(
                          selectedSchemeForModal.TYPE || "flexible"
                        ) as any
                      }
                      size={24}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.modalTitleText}>
                    <Text style={styles.modalTitle}>
                      {getLocalizedText(selectedSchemeForModal.SCHEMENAME)}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {getLocalizedText(selectedSchemeForModal.SLOGAN)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                {/* Scheme Overview */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>{t("schemeOverview")}</Text>
                  <Text style={styles.sectionContent}>
                    {getLocalizedText(
                      selectedSchemeForModal.DETAILEDDESCRIPTION
                    )}
                  </Text>
                </View>

                {/* Key Details */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>{t("keyDetails")}</Text>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>
                        {t("amountRange")}
                      </Text>
                      <Text style={styles.detailCardValue}>
                        {selectedSchemeForModal.MINAMOUNT || "₹100"} -{" "}
                        {selectedSchemeForModal.MAXAMOUNT || "No limit"}
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>
                        {t("duration")}
                      </Text>
                      <Text style={styles.detailCardValue}>
                        {selectedSchemeForModal.DURATION || "12 months"}
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>{t("returns")}</Text>
                      <Text style={styles.detailCardValue}>
                        {selectedSchemeForModal.RETURNS || "Gold"}
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailCardLabel}>{t("type")}</Text>
                      <Text style={styles.detailCardValue}>
                        {(selectedSchemeForModal.TYPE || "flexible") ===
                        "flexible"
                          ? t("flexi")
                          : t("fixed")}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Benefits */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>{t("keyBenefits")}</Text>
                  {(selectedSchemeForModal.BENEFITS || []).map(
                    (benefit, index) => (
                      <View key={index} style={styles.benefitModalItem}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={
                            getSchemeGradient(
                              selectedSchemeForModal.TYPE || "flexible"
                            )[0]
                          }
                        />
                        <Text style={styles.benefitModalText}>{benefit}</Text>
                      </View>
                    )
                  )}
                </View>

                {/* Joining Procedure */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>
                    {t("joiningProcedure")}
                  </Text>
                  {(selectedSchemeForModal.JOININGPROCEDURE || []).map(
                    (step, index) => (
                      <View key={index} style={styles.procedureItem}>
                        <View
                          style={[
                            styles.procedureNumber,
                            {
                              backgroundColor: getSchemeGradient(
                                selectedSchemeForModal.TYPE || "flexible"
                              )[0],
                            },
                          ]}
                        >
                          <Text style={styles.procedureNumberText}>
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.procedureText}>{step}</Text>
                      </View>
                    )
                  )}
                </View>

                {/* Eligibility */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>{t("eligibility")}</Text>
                  {(selectedSchemeForModal.ELIGIBILITY || []).map(
                    (item, index) => (
                      <View key={index} style={styles.eligibilityItem}>
                        <Ionicons name="person-circle" size={16} color="#666" />
                        <Text style={styles.eligibilityText}>{item}</Text>
                      </View>
                    )
                  )}
                </View>

                {/* Required Documents */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>
                    {t("requiredDocuments")}
                  </Text>
                  {(selectedSchemeForModal.DOCUMENTS || []).map(
                    (doc, index) => (
                      <View key={index} style={styles.documentItem}>
                        <Ionicons name="document-text" size={16} color="#666" />
                        <Text style={styles.documentText}>{doc}</Text>
                      </View>
                    )
                  )}
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <View style={styles.modalFooterButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalInfoButton,
                      {
                        backgroundColor: "#f8f9fa",
                        borderColor: getSchemeGradient(
                          selectedSchemeForModal.TYPE || "flexible"
                        )[0],
                      },
                    ]}
                    onPress={() => {
                      // Info button action - could show additional details or navigate to help
                      logger.log("Info button pressed");
                    }}
                  >
                    <Ionicons
                      name="information-circle"
                      size={20}
                      color={
                        getSchemeGradient(
                          selectedSchemeForModal.TYPE || "flexible"
                        )[0]
                      }
                    />
                    <Text
                      style={[
                        styles.modalInfoButtonText,
                        {
                          color: getSchemeGradient(
                            selectedSchemeForModal.TYPE || "flexible"
                          )[0],
                        },
                      ]}
                    >
                      {t("moreInfo")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalJoinButton,
                      {
                        backgroundColor: getSchemeGradient(
                          selectedSchemeForModal.TYPE || "flexible"
                        )[0],
                      },
                    ]}
                    onPress={() => {
                      setModalVisible(false);
                      router.push({
                        pathname: "/home/join_savings",
                        params: {
                          schemeId: selectedSchemeForModal.SCHEMEID.toString(),
                        },
                      });
                    }}
                  >
                    <Text style={styles.modalJoinButtonText}>
                      {t("joinThisScheme")}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  const handleViewAll = () => {
    router.push("/(app)/(tabs)/home/schemes");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t("joinSchemes")}</Text>
          <Text style={styles.subtitle}>{t("exploreGoldSavingsPlans")}</Text>
        </View>
        {showViewAll && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewAll}
          >
            <Text style={styles.viewAllText}>{t("viewAll")}</Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>{t("loading")}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={40} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              // Re-fetch data
              const fetchSchemes = async () => {
                try {
                  setLoading(true);
                  const response = await api.get("/schemes");
                  if (response.data?.data) {
                    setSchemes(response.data.data);
                  } else {
                    setSchemes([]);
                  }
                } catch (err) {
                  setError("Failed to load schemes");
                } finally {
                  setLoading(false);
                }
              };
              fetchSchemes();
            }}
          >
            <Text style={styles.retryButtonText}>{t("retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : schemes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={40} color="#777" />
          <Text style={styles.emptyText}>{t("noSchemesAvailable")}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={schemes}
          renderItem={renderSchemeCard}
          keyExtractor={(item) => item.SCHEMEID.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
          pagingEnabled={false}
          bounces={true}
          style={styles.flatList}
        />
      )}

      {renderModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: "400",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: `${theme.colors.primary}10`,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
    marginRight: 4,
  },
  flatList: {
    flexGrow: 0,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_MARGIN,
  },
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardBackground: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  schemeTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  schemeType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    textTransform: "uppercase",
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 16,
  },
  schemeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    lineHeight: 24,
  },
  slogan: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontStyle: "italic",
    marginBottom: 10,
    lineHeight: 16,
  },
  description: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  schemeDetails: {
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  benefitsPreview: {
    flex: 1,
    marginRight: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: 6,
    flex: 1,
    lineHeight: 14,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoButtonFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    gap: 4,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.success,
    shadowColor: theme.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
    marginRight: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 0,
    width: "100%",
    height: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  modalTitleText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    minWidth: 40,
    minHeight: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailCard: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    minWidth: "45%",
  },
  detailCardLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  benefitModalItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  benefitModalText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  procedureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  procedureNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  procedureNumberText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  procedureText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    lineHeight: 20,
  },
  eligibilityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  eligibilityText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  documentText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 34 : 20, // Account for home indicator on iOS
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  modalFooterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalInfoButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  modalInfoButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  modalJoinButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
});

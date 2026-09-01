import { useAppTheme } from "@/store/global.store";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { formatGoldWeight } from "@/utils/imageUtils";
import { theme } from "@/constants/theme";
import api from "@/services/api";

type Scheme = {
  id: string;
  schemeName: string;
  savingType: string;
  status?: string;
  totalPaid: number;
  maturityDate: string;
  goldWeight: number;
  accountHolder: string;
  accNo: string;
  joiningDate: string;
  grossWeight?: number;
  purityCarat?: number;
  daysToMaturity?: number;
  ornamentDescription?: string;
  ornamentPhotos?: string[];
  valuationAmount?: number | string;
};

interface OldGoldSchemeCardProps {
  item: Scheme;
  translations: any;
}

const OldGoldSchemeCard: React.FC<OldGoldSchemeCardProps> = ({
  item,
  translations,
}) => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [isActive, setIsActive] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setIsActive(!isActive);
    Animated.spring(animatedHeight, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
  };

  const getLocalizedText = (textObj: any): string => {
    if (!textObj) return "";
    if (typeof textObj === "string") return textObj.trim();
    if (typeof textObj === "object") {
      return textObj.en || textObj.EN || textObj.ta || textObj.TA || Object.values(textObj)[0] || "";
    }
    return String(textObj);
  };

  const valAmount = parseFloat(String(item.valuationAmount || 0)) || 0;

  return (
    <View
      style={[
        styles.cardWrapper,
        isActive && styles.cardWrapperActive,
        {
          borderLeftWidth: 6,
          borderLeftColor: "#D97706", // Warm dark gold for Old Gold Schemes
          borderWidth: isExpanded ? 1.5 : 1,
          borderColor: isExpanded ? (theme.colors.gold || "#D97706") : "rgba(0, 0, 0, 0.08)",
        }
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={toggleExpand}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.schemeInfo}>
            <View style={styles.schemeTitleContainer}>
              <Text style={styles.schemeTitle}>
                {(getLocalizedText(item.schemeName) || "Old Gold Scheme").toUpperCase()}
              </Text>
              <View style={styles.schemeSubtitleContainer}>
                <View
                  style={[
                    styles.metalTypeBadge,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Text style={styles.metalTypeText}>Gold</Text>
                </View>
                <View
                  style={[
                    styles.savingTypeBadge,
                    { backgroundColor: theme.colors.bgGoldHeavy },
                  ]}
                >
                  <Text style={styles.savingTypeText}>Old Gold</Text>
                </View>
                <View
                  style={[
                    styles.savingTypeBadge,
                    { backgroundColor: theme.colors.bgErrorMedium },
                  ]}
                >
                  <Text style={styles.savingTypeText}>Weight</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    item.status?.toLowerCase() === "active"
                      ? "rgba(8, 237, 8, 0.56)"
                      : "rgba(255, 0, 0, 0.2)",
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.status?.toLowerCase() === "active" ? "#000" : "#FF0000",
                  },
                ]}
              >
                {item.status?.toUpperCase() || "INACTIVE"}
              </Text>
            </View>
            <View style={styles.expandIcon}>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>

        {/* Core Info Row 1 (Account details) */}
        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="person-outline" size={16} color={theme.colors.textDark} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                A/C Name / No
              </Text>
              <Text style={styles.paymentInfoValue}>
                {(item.accountHolder || "N/A").toUpperCase()} / STT-OG-{item.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Core Info Row 2 (Weight/Frequency details) */}
        <View style={styles.paymentInfoRow}>
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="time-outline" size={16} color={theme.colors.textDark} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                Frequency
              </Text>
              <Text style={styles.paymentInfoValue}>One-time</Text>
            </View>
          </View>
          <View style={styles.paymentInfoDivider} />
          <View style={styles.paymentInfoItem}>
            <View style={styles.paymentInfoIconContainer}>
              <Ionicons name="scale-outline" size={16} color={theme.colors.textDark} />
            </View>
            <View style={styles.paymentInfoContent}>
              <Text style={styles.paymentInfoLabel}>
                {translations.totalWeight || "Total Weight"}
              </Text>
              <Text style={styles.paymentInfoValue}>
                {formatGoldWeight(item.goldWeight)}
              </Text>
            </View>
          </View>
        </View>

      </TouchableOpacity>

      {/* Expanded Accordion Details */}
      <Animated.View
        style={[
          styles.cardContent,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 600],
            }),
          },
        ]}
      >
        <View style={styles.expandedContainer}>
          {/* Metadata Row 1 */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="wallet-outline" size={20} color={theme.colors.textDark} />
              </View>
              <Text style={styles.infoLabel}>Valuation Amount</Text>
              <Text style={styles.infoValue}>
                ₹{valAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="scale-outline" size={20} color={theme.colors.textDark} />
              </View>
              <Text style={styles.infoLabel}>Gross Weight</Text>
              <Text style={styles.infoValue}>
                {formatGoldWeight(item.grossWeight || item.goldWeight)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="ribbon-outline" size={20} color={theme.colors.textDark} />
              </View>
              <Text style={styles.infoLabel}>Purity Carat</Text>
              <Text style={styles.infoValue}>
                {item.purityCarat || 22}K
              </Text>
            </View>
          </View>

          {/* Timeline and dates */}
          <View style={styles.dateContainer}>
            <View style={styles.dateSection}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar-outline" size={16} color="#FFF" />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Deposit Date</Text>
                <Text style={styles.dateValue}>{item.joiningDate}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateSection}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="hourglass-outline" size={16} color="#FFF" />
              </View>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>Maturity Date</Text>
                <Text style={styles.dateValue}>{item.maturityDate}</Text>
              </View>
            </View>
          </View>

          {/* Days Remaining or description */}
          <View style={styles.descriptionRow}>
            {item.daysToMaturity !== undefined && (
              <View style={styles.metadataPill}>
                <Ionicons name="time" size={14} color="#DAA520" style={{ marginRight: 4 }} />
                <Text style={styles.metadataPillText}>
                  {item.daysToMaturity} Days to Maturity
                </Text>
              </View>
            )}
            {item.ornamentDescription ? (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.expandedLabel}>Ornament Description</Text>
                <Text style={styles.expandedDesc}>{item.ornamentDescription}</Text>
              </View>
            ) : null}
          </View>

          {/* Photos and PDF uploads */}
          {item.ornamentPhotos && item.ornamentPhotos.length > 0 && (
            <View style={styles.attachmentsContainer}>
              {(() => {
                const images = item.ornamentPhotos.filter(
                  (p) => !p.toLowerCase().endsWith(".pdf")
                );
                if (images.length === 0) return null;
                return (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={styles.expandedLabel}>Photos</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {images.map((photo, idx) => {
                        const baseURL = api.defaults.baseURL
                          ? api.defaults.baseURL.replace(/\/$/, "")
                          : "https://api.srithangathamarai.com";
                        const cleanPhoto = photo.startsWith("/") ? photo : `/${photo}`;
                        const fullUrl = photo.startsWith("http") ? photo : `${baseURL}${cleanPhoto}`;
                        return (
                          <Image
                            key={idx}
                            source={{ uri: fullUrl }}
                            style={styles.ornamentImage}
                            resizeMode="cover"
                          />
                        );
                      })}
                    </ScrollView>
                  </View>
                );
              })()}

              {(() => {
                const docs = item.ornamentPhotos.filter((p) =>
                  p.toLowerCase().endsWith(".pdf")
                );
                if (docs.length === 0) return null;
                return (
                  <View>
                    <Text style={styles.expandedLabel}>Documents & Receipts</Text>
                    {docs.map((doc, idx) => {
                      const baseURL = api.defaults.baseURL
                        ? api.defaults.baseURL.replace(/\/$/, "")
                        : "https://api.srithangathamarai.com";
                      const cleanDoc = doc.startsWith("/") ? doc : `/${doc}`;
                      const fullUrl = doc.startsWith("http") ? doc : `${baseURL}${cleanDoc}`;
                      const fileName =
                        doc.split("/").pop()?.split("-").slice(1).join("-") ||
                        doc.split("/").pop() ||
                        "document.pdf";
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.documentRow}
                          onPress={() =>
                            Linking.openURL(fullUrl).catch((err) =>
                              console.error("Error opening URL:", err)
                            )
                          }
                        >
                          <Ionicons
                            name="document-text"
                            size={18}
                            color="#FF3B30"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.documentText} numberOfLines={1}>
                            {fileName}
                          </Text>
                          <Ionicons name="download-outline" size={14} color="#D4AF37" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })()}
            </View>
          )}
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            router.push("/(app)/old_gold");
          }}
        >
          <LinearGradient
            colors={theme.colors.gradientPrimary || ["#0b162c", "#16315c", "#d4af37"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.detailsButtonGradient}
          >
            <Text style={styles.detailsButtonText}>
              {translations.viewDetails || "View Details"}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function getStyles(theme: any) {
  return StyleSheet.create({
    cardWrapper: {
      marginHorizontal: 16,
      marginBottom: 20,
      borderRadius: 24,
      overflow: "hidden",
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      backgroundColor: "rgb(255, 255, 255)",
    },
    cardWrapperActive: {
      transform: [{ scale: 1.02 }],
      elevation: 12,
      shadowOpacity: 0.3,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      margin: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: "rgba(255, 255, 255, 0.81)",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    schemeInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    schemeTitleContainer: {
      flex: 1,
    },
    schemeTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#000",
      marginBottom: 6,
    },
    schemeSubtitleContainer: {
      flexDirection: "row",
      gap: 8,
    },
    metalTypeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    metalTypeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#000",
    },
    savingTypeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    savingTypeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#000",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.6)",
    },
    statusText: {
      fontSize: 8,
      fontWeight: "600",
    },
    expandIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(133, 1, 17, 0.08)",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: "rgba(133, 1, 17, 0.15)",
    },
    paymentInfoRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingBottom: 16,
      alignItems: "center",
    },
    paymentInfoItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    paymentInfoIconContainer: {
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    paymentInfoContent: {
      flex: 1,
    },
    paymentInfoLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    paymentInfoValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.textDark,
    },
    paymentInfoDivider: {
      width: 1,
      height: 30,
      backgroundColor: theme.colors.border,
      marginHorizontal: 12,
    },
    cardContent: {
      overflow: "hidden",
    },
    expandedContainer: {
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 12,
    },
    infoItem: {
      flex: 1,
      alignItems: "center",
      padding: 10,
      backgroundColor: "rgba(255, 255, 255, 0.48)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "rgba(0, 0, 0, 0.05)",
    },
    infoIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: "rgba(228, 16, 41, 0.12)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    },
    infoLabel: {
      fontSize: 10,
      color: "rgba(7, 0, 0, 0.6)",
      marginBottom: 2,
      textAlign: "center",
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "700",
      color: "#000",
      textAlign: "center",
    },
    dateContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "rgba(45, 22, 17, 0.88)",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    dateSection: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateIconContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    dateInfo: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 10,
      color: "rgba(255, 255, 255, 0.7)",
    },
    dateValue: {
      fontSize: 12,
      fontWeight: "500",
      color: "#FFFFFF",
    },
    dateDivider: {
      width: 1,
      height: "100%",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      marginHorizontal: 8,
    },
    descriptionRow: {
      marginBottom: 12,
    },
    metadataPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(218, 165, 32, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(218, 165, 32, 0.2)",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      alignSelf: "flex-start",
    },
    metadataPillText: {
      fontSize: 12,
      color: "#B8860B",
      fontWeight: "600",
    },
    expandedLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "rgba(0, 0, 0, 0.6)",
      marginBottom: 4,
    },
    expandedDesc: {
      fontSize: 13,
      color: "#000",
      lineHeight: 18,
    },
    attachmentsContainer: {
      marginTop: 8,
      backgroundColor: "rgba(0, 0, 0, 0.02)",
      borderRadius: 12,
      padding: 8,
    },
    ornamentImage: {
      width: 70,
      height: 70,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    documentRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.white,
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
      borderRadius: 8,
      padding: 8,
      marginTop: 4,
    },
    documentText: {
      fontSize: 12,
      color: "#B8860B",
      fontWeight: "600",
      flex: 1,
    },
    actionButtonsContainer: {
      flexDirection: "row",
      marginHorizontal: 12,
      marginBottom: 16,
    },
    detailsButton: {
      flex: 1,
      borderRadius: 16,
      overflow: "hidden",
      elevation: 4,
      shadowColor: "#850111",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    detailsButtonGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    detailsButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: "#fff",
      marginRight: 8,
    },
  })
}

var styles = getStyles(theme);;

export default OldGoldSchemeCard;

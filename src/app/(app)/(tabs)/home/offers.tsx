import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { offersAPI } from "@/services/api";
import { getImageSource, getFullImageUrl } from "@/utils/imageUtils";
import { logger } from "@/utils/logger";

const { width, height } = Dimensions.get("window");

export default function Offers() {
  const { t } = useTranslation();
  const router = useRouter();
  const [offersList, setOffersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchOffers = async (isRefreshing = false) => {
    try {
      isRefreshing ? setRefreshing(true) : setIsLoading(true);
      const response = await offersAPI.getOffers();
      if (response.data && response.data.success) {
        const fetchedOffers = response.data.data || [];
        const activeOnly = fetchedOffers.filter((o: any) => o.status === "active");
        setOffersList(activeOnly);
      }
    } catch (error) {
      logger.error("Error fetching offers page:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const openOfferModal = (offer: any) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const closeOfferModal = () => {
    setModalVisible(false);
    setSelectedOffer(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOffers(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[theme.colors.primary, "#a8000a"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <FontAwesome name="tag" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.heroTitle}>{t("specialDealsAwait") || "Special Deals Await"}</Text>
          <Text style={styles.heroSubtitle}>
            {t("discoverLimitedTimeOffers") || "Discover limited-time offers curated just for you"}
          </Text>
        </LinearGradient>

        {/* Loading State */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Loading latest offers...</Text>
          </View>
        ) : offersList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="local-offer" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No active offers available at the moment.</Text>
          </View>
        ) : (
          /* Offers List */
          <View style={styles.offersContainer}>
            {offersList.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                style={styles.card}
                onPress={() => openOfferModal(offer)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["white", "#FFF8F8"]}
                  style={styles.cardGradient}
                >
                  <Image
                    source={getImageSource(offer.image_url) ?? { uri: getFullImageUrl('/uploads/default.jpg') }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.cardInfoContainer}>
                    <Text style={styles.cardTitle}>{offer.title}</Text>
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {offer.subtitle}
                    </Text>
                    
                    <View style={styles.cardFooter}>
                      <View style={styles.validityBadge}>
                        <MaterialIcons name="schedule" size={14} color="#666" />
                        <Text style={styles.validityBadgeText}>
                          Until {offer.end_date}
                        </Text>
                      </View>
                      
                      {parseFloat(offer.discount) > 0 && (
                        <View style={styles.discountBadgeInline}>
                          <Text style={styles.discountBadgeInlineText}>
                            {parseInt(offer.discount)}% OFF
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.claimButton}>
                      <Text style={styles.claimButtonText}>{t("viewDetails") || "View Details"}</Text>
                      <MaterialIcons
                        name="chevron-right"
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Offer Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeOfferModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOffer && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedOffer.title}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={closeOfferModal}
                    style={styles.closeButton}
                  >
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Discount Badge */}
                {parseFloat(selectedOffer.discount) > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {parseInt(selectedOffer.discount)}% DISCOUNT
                    </Text>
                  </View>
                )}

                {/* Modal Body */}
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Image
                    source={getImageSource(selectedOffer.image_url) ?? { uri: getFullImageUrl('/uploads/default.jpg') }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <Text style={styles.modalDescription}>
                    {selectedOffer.subtitle}
                  </Text>

                  <View style={styles.validUntilContainer}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.validUntilText}>
                      Validity: {selectedOffer.start_date} to {selectedOffer.end_date}
                    </Text>
                  </View>

                  <View style={styles.termsContainer}>
                    <Text style={styles.termsTitle}>
                      {t("termsAndConditions") || "Terms & Conditions"}
                    </Text>
                    <View style={styles.termItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.termText}>Offer is valid on selected jewellery collections.</Text>
                    </View>
                    <View style={styles.termItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.termText}>Cannot be combined with any other schemes or discount offers.</Text>
                    </View>
                    <View style={styles.termItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.termText}>Please present this offer screen at the billing counter to claim.</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.claimOfferButton} onPress={closeOfferModal}>
                    <Text style={styles.claimOfferText}>{t("claimOffer") || "Claim Offer"}</Text>
                    <MaterialIcons
                      name="arrow-forward"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  offersContainer: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    overflow: "hidden",
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardImage: {
    width: "100%",
    height: 180,
  },
  cardInfoContainer: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  validityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  validityBadgeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  discountBadgeInline: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountBadgeInlineText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  claimButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  spacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.7,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  discountBadge: {
    backgroundColor: theme.colors.primary,
    alignSelf: "flex-start",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 20,
  },
  validUntilContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  validUntilText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  termsContainer: {
    marginBottom: 20,
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  termItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    gap: 8,
  },
  termText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  claimOfferButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  claimOfferText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// AppHeader is now handled by the layout wrapper
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

const { width, height } = Dimensions.get("window");

interface Offer {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  fullDescription: string;
  validUntil: string;
  terms: string[];
  discount: string;
  category: string;
}

export default function Offers() {
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const offers: Offer[] = [
    {
      id: 1,
      title: t("festiveSpecial"),
      description: t("enjoy20Off"),
      icon: "celebration",
      color: "#FFD700",
      fullDescription: t("fullDescriptionFestive"),
      validUntil: t("validUntil") + " December 31, 2024",
      terms: [
        t("categoryGoldJewelry"),
        t("exclusiveMemberOffers"),
        t("validUntil") + " December 31, 2024",
        t("termsAndConditions"),
      ],
      discount: t("discount20"),
      category: t("categoryGoldJewelry"),
    },
    {
      id: 2,
      title: t("newArrivals"),
      description: t("flat15OffDiamond"),
      icon: "diamond",
      color: "#40E0D0",
      fullDescription: t("fullDescriptionDiamond"),
      validUntil: t("validUntil") + " January 15, 2025",
      terms: [
        t("categoryDiamondCollection"),
        t("exclusiveMemberOffers"),
        t("validUntil") + " January 15, 2025",
        t("termsAndConditions"),
      ],
      discount: t("discount15"),
      category: t("categoryDiamondCollection"),
    },
    {
      id: 3,
      title: t("exclusiveMembership"),
      description: t("specialOffersAllYear"),
      icon: "star",
      color: theme.colors.primary,
      fullDescription: t("fullDescriptionMembership"),
      validUntil: t("ongoing"),
      terms: [
        t("annualMembershipFee"),
        t("exclusiveMemberOffers"),
        t("earlyAccess"),
        t("priorityCustomerService"),
      ],
      discount: t("vipBenefitsDiscount"),
      category: t("categoryMembership"),
    },
  ];

  const openOfferModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setModalVisible(true);
  };

  const closeOfferModal = () => {
    setModalVisible(false);
    setSelectedOffer(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header is now handled by the layout wrapper */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <LinearGradient
          colors={[theme.colors.primary, "#a8000a"]}
          style={styles.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <FontAwesome name="tag" size={48} color="rgba(255,255,255,0.2)" />
          <Text style={styles.heroTitle}>{t("specialDealsAwait")}</Text>
          <Text style={styles.heroSubtitle}>
            {t("discoverLimitedTimeOffers")}
          </Text>
        </LinearGradient>

        {/* Offers List */}
        <View style={styles.offersContainer}>
          {offers.map((offer) => (
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
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: offer.color },
                    ]}
                  >
                    <MaterialIcons name={offer.icon} size={24} color="white" />
                  </View>
                  <Text style={styles.cardTitle}>{offer.title}</Text>
                </View>
                <Text style={styles.cardDescription}>{offer.description}</Text>
                <View style={styles.claimButton}>
                  <Text style={styles.claimButtonText}>{t("viewDetails")}</Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer CTA */}
        {/* <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push("/membership")}
        >
          <Text style={styles.ctaText}>Become a VIP Member</Text>
          <Ionicons name="sparkles" size={20} color="white" />
        </TouchableOpacity> */}

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
                    <View
                      style={[
                        styles.modalIconContainer,
                        { backgroundColor: selectedOffer.color },
                      ]}
                    >
                      <MaterialIcons
                        name={selectedOffer.icon}
                        size={32}
                        color="white"
                      />
                    </View>
                    <View style={styles.modalTitleContainer}>
                      <Text style={styles.modalTitle}>
                        {selectedOffer.title}
                      </Text>
                      <Text style={styles.modalCategory}>
                        {selectedOffer.category}
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
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {selectedOffer.discount}
                  </Text>
                </View>

                {/* Modal Body */}
                <ScrollView
                  style={styles.modalBody}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.modalDescription}>
                    {selectedOffer.fullDescription}
                  </Text>

                  <View style={styles.validUntilContainer}>
                    <MaterialIcons name="schedule" size={16} color="#666" />
                    <Text style={styles.validUntilText}>
                      {selectedOffer.validUntil}
                    </Text>
                  </View>

                  <View style={styles.termsContainer}>
                    <Text style={styles.termsTitle}>
                      {t("termsAndConditions")}
                    </Text>
                    {selectedOffer.terms.map((term, index) => (
                      <View key={index} style={styles.termItem}>
                        <MaterialIcons
                          name="check-circle"
                          size={16}
                          color={theme.colors.primary}
                        />
                        <Text style={styles.termText}>{term}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Modal Footer */}
                <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.claimOfferButton}>
                    <Text style={styles.claimOfferText}>{t("claimOffer")}</Text>
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
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
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
  offersContainer: {
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  cardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  claimButtonText: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  ctaText: {
    color: "white",
    fontWeight: "600",
    marginRight: 8,
    fontSize: 16,
  },
  spacer: {
    height: 20,
  },
  // Modal Styles
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
  modalIconContainer: {
    borderRadius: 16,
    padding: 12,
    marginRight: 16,
  },
  modalTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalCategory: {
    fontSize: 14,
    color: "#666",
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
    fontSize: 16,
  },
  modalBody: {
    flex: 1,
    padding: 20,
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
    marginBottom: 8,
  },
  termText: {
    marginLeft: 8,
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

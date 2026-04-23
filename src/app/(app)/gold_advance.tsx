import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "src/constants/colors";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || "#F2E6D2";

export default function GoldAdvanceScreen() {
  const router = useRouter();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);

  const advanceOptions = [
    {
      percentage: "5%",
      days: 30,
      minPayment: "5%",
      details: "Pay 5% of the total amount as advance and get 30 days to complete your purchase at the best rate.",
      gradient: ["#850111", "#a30115"] as const, // Primary Red
      icon: "flash",
    },
    {
      percentage: "10%",
      days: 60,
      minPayment: "10%",
      details: "Pay 10% of the total amount as advance and get 60 days to complete your purchase at the best rate.",
      gradient: ["#1c1008", "#3a2210"] as const, // Dark Brown
      icon: "trending-up",
    },
    {
      percentage: "20%",
      days: 90,
      minPayment: "20%",
      details: "Pay 20% of the total amount as advance and get 90 days to complete your purchase at the best rate.",
      gradient: ["#9a6f00", "#c99a00"] as const, // Golden
      icon: "star",
    },
    {
      percentage: "30%",
      days: 120,
      minPayment: "30%",
      details: "Pay 30% of the total amount as advance and get 120 days to complete your purchase at the best rate.",
      gradient: ["#6b0010", "#900015"] as const, // Deep Burgundy
      icon: "diamond",
    },
  ];

  const handleInfo = (option: any) => {
    setSelectedOption(option);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOption(null);
  };

  const handleEnquire = (option: (typeof advanceOptions)[0]) => {
    router.push({
      pathname: "/(app)/(tabs)/joinAdvGold",
      params: { advancePercent: option.percentage.replace("%", "") },
    });
  };

  const handleButtonPress = (index: number) => {
    setPressedButton(index);
    setTimeout(() => setPressedButton(null), 200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient
        colors={["rgba(133,1,17,0.05)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          Gold Advance
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <ResponsiveText variant="title" weight="bold" color={theme.colors.primary} align="center" style={styles.mainTitle}>
            Secure Today's Rate
          </ResponsiveText>
          <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
            Book your gold in advance with our flexible options
          </ResponsiveText>
          <View style={styles.decorativeLine} />
        </View>

        <View style={styles.cardsContainer}>
          {advanceOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.cardWrapper, pressedButton === index && styles.cardPressed]}
              onPress={() => {
                handleButtonPress(index);
                handleEnquire(option);
              }}
              activeOpacity={0.9}
            >
              {/* Glow Effect */}
              <View style={styles.cardGlow} />

              <LinearGradient
                colors={option.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {/* Glossy Overlay */}
                <LinearGradient
                  colors={["rgba(255,255,255,0.15)", "transparent", "rgba(0,0,0,0.2)"]}
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.cardHeader}>
                  <View style={styles.cornerTag}>
                    <Ionicons name="calendar" size={12} color={COLORS.white} />
                    <Text style={styles.cornerText}>{option.days} DAYS</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.infoButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleInfo(option);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="information-circle-outline" size={24} color={COLORS.white} />
                  </TouchableOpacity>
                  <View style={styles.iconRow}>
                    <Ionicons name={option.icon as any} size={36} color="#DAA520" style={{ marginRight: 12 }} />
                    <Text style={styles.percentageText}>{option.percentage}</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.featureRow}>
                    <Ionicons name="wallet-outline" size={wp(5)} color={theme.colors.primary} />
                    <ResponsiveText variant="body" size="sm" color={theme.colors.textDark} style={styles.featureText}>
                      Pay Minimum {option.minPayment}
                    </ResponsiveText>
                  </View>
                  <View style={styles.featureRow}>
                    <Ionicons name="time-outline" size={wp(5)} color={theme.colors.primary} />
                    <ResponsiveText variant="body" size="sm" color={theme.colors.textDark} style={styles.featureText}>
                      Get {option.days} days advance period
                    </ResponsiveText>
                  </View>

                  <Text style={styles.rateText}>
                    Avail the rate of Gold at the time of booking or at the purchase, whichever is less.
                  </Text>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleInfo(option);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.moreButtonText}>MORE INFO</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.enquireButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEnquire(option);
                      }}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={["#DAA520", "#b8860b"]}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.buttonText}>ENQUIRE NOW</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Modal */}
        <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={handleCloseModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={["#850111", "#6b0010"]} style={styles.modalHeader}>
                <ResponsiveText variant="title" size="sm" weight="bold" color={COLORS.white} style={{ flex: 1 }}>
                  Advance Option Details
                </ResponsiveText>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </LinearGradient>
              {selectedOption && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDetail}><Text style={styles.boldDetail}>Advance %:</Text> {selectedOption.percentage}</Text>
                  <Text style={styles.modalDetail}><Text style={styles.boldDetail}>Days:</Text> {selectedOption.days}</Text>
                  <Text style={styles.modalDetail}><Text style={styles.boldDetail}>Min Payment:</Text> {selectedOption.minPayment}</Text>
                  <Text style={styles.modalDetail}><Text style={styles.boldDetail}>Details:</Text> {selectedOption.details}</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: wp(4),
    paddingBottom: hp(12),
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: hp(3),
  },
  mainTitle: {
    fontSize: rf(24),
    marginBottom: hp(1),
  },
  subtitle: {
    fontSize: rf(12),
    marginBottom: hp(2),
  },
  decorativeLine: {
    width: wp(15),
    height: 3,
    backgroundColor: "#DAA520",
    borderRadius: 2,
  },
  cardsContainer: {
    gap: hp(3),
  },
  cardWrapper: {
    marginBottom: hp(1),
  },
  cardGlow: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 22,
    backgroundColor: "#DAA520",
    opacity: 0.5,
    zIndex: -1,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardGradient: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.3)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cardHeader: {
    padding: wp(5),
    minHeight: hp(14),
    position: "relative",
    justifyContent: "center",
  },
  cornerTag: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#DAA520",
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderBottomLeftRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  cornerText: {
    color: COLORS.white,
    fontSize: rf(10),
    fontWeight: "bold",
    marginLeft: 4,
  },
  infoButton: {
    position: "absolute",
    top: hp(1.5),
    left: wp(4),
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: 4,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2),
  },
  percentageText: {
    fontSize: rf(42),
    fontWeight: "bold",
    color: COLORS.white,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardBody: {
    padding: wp(4),
    backgroundColor: COLORS.white,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  featureText: {
    marginLeft: wp(3),
  },
  rateText: {
    fontSize: rf(10),
    color: "rgba(0,0,0,0.5)",
    textAlign: "center",
    marginTop: hp(1),
    marginBottom: hp(2),
    fontStyle: "italic",
    paddingHorizontal: wp(2),
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: wp(3),
  },
  moreButton: {
    flex: 0.4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: hp(1.5),
    alignItems: "center",
    justifyContent: "center",
  },
  moreButtonText: {
    color: theme.colors.primary,
    fontSize: rf(11),
    fontWeight: "bold",
  },
  enquireButton: {
    flex: 0.6,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: hp(1.5),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: rf(11),
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: "85%",
    overflow: "hidden",
    elevation: 10,
  },
  modalHeader: {
    padding: wp(5),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: wp(5),
  },
  modalDetail: {
    fontSize: rf(12),
    color: theme.colors.textDark,
    marginBottom: hp(1.5),
    lineHeight: rf(18),
  },
  boldDetail: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
});


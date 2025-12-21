import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// AppHeader is now handled by the layout wrapper
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "src/constants/colors";

export default function GoldAdvanceScreen() {
  const router = useRouter();

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);

  const advanceOptions = [
    {
      percentage: "5%",
      days: 30,
      color: COLORS.green,
      minPayment: "5%",
      details:
        "Pay 5% of the total amount as advance and get 30 days to complete your purchase at the best rate.",
      gradient: [COLORS.errorLight, COLORS.errorLight] as const,
      icon: "flash",
    },
    {
      percentage: "10%",
      days: 60,
      color: COLORS.gold,
      minPayment: "10%",
      details:
        "Pay 10% of the total amount as advance and get 60 days to complete your purchase at the best rate.",
      gradient: [COLORS.green, COLORS.greenLight] as const,
      icon: "trending-up",
    },
    {
      percentage: "20%",
      days: 90,
      color: COLORS.errorLight,
      minPayment: "20%",
      details:
        "Pay 20% of the total amount as advance and get 90 days to complete your purchase at the best rate.",
      gradient: [COLORS.gold, COLORS.goldLight] as const,
      icon: "star",
    },
    {
      percentage: "30%",
      days: 120,
      color: COLORS.errorLight,
      minPayment: "30%",
      details:
        "Pay 30% of the total amount as advance and get 120 days to complete your purchase at the best rate.",
      gradient: [COLORS.blue, COLORS.blue] as const,
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
    // Navigate to joinadvancegold page, passing advance %
    router.push({
      pathname: "/(app)/(tabs)/joinadvancegold",
      params: { advancePercent: option.percentage.replace("%", "") },
    });
  };

  const handleButtonPress = (index: number) => {
    setPressedButton(index);
    setTimeout(() => setPressedButton(null), 200);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header is now handled by the layout wrapper */}

      {/* Animated Background */}
      <LinearGradient
        colors={[
          COLORS.cardBackgroundLight,
          COLORS.cardBackgroundMedium,
          COLORS.cardBackgroundMedium,
        ]}
        style={styles.backgroundGradient}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>Gold Advance</Text>
          <Text style={styles.subtitle}>
            Book your gold in advance and secure today's rate
          </Text>
          <View style={styles.decorativeLine} />
        </View>

        <View style={styles.cardsContainer}>
          {advanceOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.cardWrapper,
                pressedButton === index && styles.cardPressed,
              ]}
              onPress={() => {
                handleButtonPress(index);
                handleEnquire(option);
              }}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={option.gradient}
                style={styles.cardHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[styles.cornerTag, { backgroundColor: option.color }]}
                >
                  <Text style={styles.cornerText}>
                    <Ionicons name="calendar" size={12} color={COLORS.white} />{" "}
                    {option.days} DAYS
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleInfo(option);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={24}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
                <View style={styles.iconRow}>
                  <Ionicons
                    name={option.icon as any}
                    size={32}
                    color={COLORS.white}
                    style={{ marginRight: 12 }}
                  />
                  <Text style={styles.percentageText}>{option.percentage}</Text>
                </View>
              </LinearGradient>
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>
                  <Ionicons name="wallet" size={16} color={COLORS.brown} /> Pay
                  Minimum {option.minPayment}
                </Text>
                <Text style={styles.cardText}>
                  <Ionicons name="time" size={16} color={COLORS.brown} /> Get{" "}
                  {option.days} days of advance period
                </Text>
                <Text style={styles.rateText}>
                  Avail the rate of Gold at the time of booking or at the
                  purchase, whichever is less
                </Text>
                {/* Action Buttons Row */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleInfo(option);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.moreButtonText}>More</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.enquireButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEnquire(option);
                    }}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={[COLORS.brown, COLORS.brownLight]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.buttonText}>ENQUIRE NOW</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleCloseModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={[COLORS.brown, COLORS.brownLight]}
                style={styles.modalHeader}
              >
                <Text style={styles.modalTitle}>Advance Option Details</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </LinearGradient>
              {selectedOption && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalDetail}>
                    <Text style={{ fontWeight: "bold" }}>Advance %:</Text>{" "}
                    {selectedOption.percentage}
                  </Text>
                  <Text style={styles.modalDetail}>
                    <Text style={{ fontWeight: "bold" }}>Days:</Text>{" "}
                    {selectedOption.days}
                  </Text>
                  <Text style={styles.modalDetail}>
                    <Text style={{ fontWeight: "bold" }}>Minimum Payment:</Text>{" "}
                    {selectedOption.minPayment}
                  </Text>
                  <Text style={styles.modalDetail}>
                    <Text style={{ fontWeight: "bold" }}>Details:</Text>{" "}
                    {selectedOption.details}
                  </Text>
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
    backgroundColor: COLORS.cardBackgroundLight,
  },
  backgroundGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "transparent",
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 180,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.brown,
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: COLORS.brownOverlay,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.brown,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
  decorativeLine: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.brown,
    borderRadius: 2,
  },
  cardsContainer: {
    gap: 24,
  },
  cardWrapper: {
    backgroundColor: COLORS.whiteOverlay,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 12,
    shadowColor: COLORS.brown,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.brownLight,
    marginBottom: 20,
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    padding: 20,
    position: "relative",
    minHeight: 120,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  cornerTag: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    zIndex: 1,
    elevation: 4,
  },
  cornerText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  percentageText: {
    fontSize: 52,
    fontWeight: "bold",
    color: COLORS.white,
    textAlign: "center",
    fontFamily: "serif",
    textShadowColor: COLORS.blackOverlay,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  cardBody: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  cardText: {
    fontSize: 16,
    color: COLORS.textDarkBrown,
    marginBottom: 10,
    textAlign: "center",
    lineHeight: 22,
  },
  rateText: {
    fontSize: 14,
    color: COLORS.textMediumGrey,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontStyle: "italic",
  },
  enquireButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    flex: 1,
  },
  moreButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.brown,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    flex: 1,
    marginRight: 8,
  },
  moreButtonText: {
    color: COLORS.brown,
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  infoButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    backgroundColor: COLORS.whiteOverlay,
    borderRadius: 20,
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.blackOverlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: "85%",
    maxHeight: "70%",
    elevation: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalDetail: {
    fontSize: 16,
    color: COLORS.textDarkBrown,
    marginBottom: 12,
    textAlign: "left",
    width: "100%",
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
});

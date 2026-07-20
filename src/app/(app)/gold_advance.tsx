import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "src/constants/colors";
import { theme } from "@/constants/theme";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import api, { advanceBookingAPI } from "@/services/api";
import { fetchPolicyWithCache } from "@/utils/apiCache";

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || "#F2E6D2";

export default function GoldAdvanceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [pressedButton, setPressedButton] = useState<number | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [termsContent, setTermsContent] = useState("");
  const [termsLoading, setTermsLoading] = useState(false);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);

  const [selectedPercentIndex, setSelectedPercentIndex] = useState(0);

  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const userId = user?.id || (user as any)?.userId;

  const fetchUserBookings = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingBookings(true);
      const response = await advanceBookingAPI.getBookingsByUser(userId);
      const list = response?.data?.data || [];
      // Filter active bookings only
      const activeList = list.filter((b: any) => b.status === "ACTIVE" || b.status === "PARTIAL");
      setUserBookings(activeList);
    } catch (err) {
      console.error("Error fetching user active bookings in gold_advance:", err);
    } finally {
      setLoadingBookings(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchUserBookings();
    }, [fetchUserBookings])
  );

  const activeOption = options.length > 0 ? options[selectedPercentIndex] : null;

  const getCustomTranslation = (key: string, fallback: string) => {
    const lang = useGlobalStore.getState().language || "en";
    const dict: Record<string, Record<string, string>> = {
      ta: {
        myActiveBookings: "எனது ஆக்டிவ் முன்பதிவுகள்",
        viewAll: "அனைத்தையும் காட்டு",
        viewDetails: "விவரங்களைக் காண்க",
        daysLeft: "நாட்கள் மீதமுள்ளன",
        viewHistory: "வரலாறு",
        amountLimit: "தொகை வரம்புகள்",
        weightLimit: "எடை வரம்புகள்",
      },
      en: {
        myActiveBookings: "My Active Bookings",
        viewAll: "View All",
        viewDetails: "View Details",
        daysLeft: "Days Left",
        viewHistory: "History",
        amountLimit: "AMOUNT LIMITS",
        weightLimit: "WEIGHT LIMITS",
      },
      te: {
        myActiveBookings: "నా క్రియాశీల బుకింగ్‌లు",
        viewAll: "அனைத்தையும் காட்டு",
        viewDetails: "விவரాలు చూడండి",
        daysLeft: "రోజులు మిగిలి ఉన్నాయి",
        viewHistory: "చరిత్ర",
        amountLimit: "మొత్తం పరిమితులు",
        weightLimit: "బరువు పరిమితులు",
      },
      hi: {
        myActiveBookings: "मेरी सक्रिय बुकिंग",
        viewAll: "सभी देखें",
        viewDetails: "विवरण देखें",
        daysLeft: "दिन शेष",
        viewHistory: "इतिहास",
        amountLimit: "राशि सीमा",
        weightLimit: "वजन सीमा",
      },
      mal: {
        myActiveBookings: "എന്റെ സജീവ ബുക്കിംഗുകൾ",
        viewAll: "എല്ലാം കാണുക",
        viewDetails: "വിശദാംശങ്ങൾ കാണുക",
        daysLeft: "ദിവസങ്ങൾ ബാക്കി",
        viewHistory: "ചരിത്രം",
        amountLimit: "തുക പരിധി",
        weightLimit: "ഭാര പരിധി",
      }
    };
    return dict[lang]?.[key] || dict["en"]?.[key] || fallback;
  };

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

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoading(true);
        const response = await api.get("/advance-booking-config?status=ACTIVE");
        if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const mapped = response.data.data.map((config: any, index: number) => {
            const pct = config.percentage;
            const days = config.booking_days;
            const isSilver = config.metal_type?.toUpperCase() === 'SILVER';

            const goldGradients = [
              ["#850111", "#a30115"], // Primary Red
              ["#1c1008", "#3a2210"], // Dark Brown
              ["#9a6f00", "#c99a00"], // Golden
              ["#6b0010", "#900015"], // Deep Burgundy
            ];
            const silverGradients = [
              ["#708090", "#c0c0c0"], // Slate & Silver
              ["#bdc3c7", "#2c3e50"], // Silver & Slate
              ["#e2e8f0", "#64748b"], // White & Cool Gray
              ["#475569", "#cbd5e1"], // Slate Gray & Light Silver
            ];
            const gradients = isSilver ? silverGradients : goldGradients;

            const goldIcons = ["flash", "trending-up", "star", "diamond"];
            const silverIcons = ["cube", "shield", "ribbon", "trophy"];
            const icons = isSilver ? silverIcons : goldIcons;

            return {
              percentage: `${pct}%`,
              days: days,
              minPayment: `${pct}%`,
              details: config.description || `Pay ${pct}% of the total amount as advance and get ${days} days to complete your purchase at the best rate.`,
              gradient: gradients[index % gradients.length],
              icon: icons[index % icons.length],
              metalType: config.metal_type?.toUpperCase() || 'GOLD',
              minBookingAmount: Number(config.min_booking_amount || 0),
              maxBookingAmount: Number(config.max_booking_amount || 0),
              minGram: Number(config.min_gram || 0),
              maxGram: Number(config.max_gram || 0),
            };
          });
          setOptions(mapped);
        } else {
          setOptions(advanceOptions);
        }
      } catch (error) {
        console.error("Error fetching advance booking configs:", error);
        setOptions(advanceOptions);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  const fetchAdvanceBookingTerms = async () => {
    try {
      setTermsLoading(true);
      const policy = await fetchPolicyWithCache('advance_booking_terms');
      if (policy) {
        const appLanguage = useGlobalStore.getState().language || "en";
        const targetKey = `description_${appLanguage}`;
        let selectedTerms = policy[targetKey] || "";

        if (appLanguage === "mal" && !selectedTerms) {
          selectedTerms = policy.description_mal || "";
        }
        if (!selectedTerms) {
          selectedTerms = policy.description || "";
        }
        if (!selectedTerms) {
          selectedTerms = policy.description_ta || "";
        }
        setTermsContent(selectedTerms);
      } else {
        setTermsContent("Terms and Conditions not available.");
      }
    } catch (error) {
      console.error("Error fetching advance booking terms:", error);
      setTermsContent("1. Advance Booking rate is fixed based on the current gold/silver rate.\n2. Booking amount is non-refundable.\n3. The balance payment must be settled at the time of delivery.");
    } finally {
      setTermsLoading(false);
    }
  };

  const handleInfo = (option: any) => {
    setSelectedOption(option);
    setTermsContent("");
    setIsTermsAccepted(false);
    setModalVisible(true);
    fetchAdvanceBookingTerms();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOption(null);
    setTermsContent("");
    setIsTermsAccepted(false);
  };

  const [enquiryModalVisible, setEnquiryModalVisible] = useState(false);
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const handleOpenEnquiryModal = (option: any) => {
    setSelectedOption(option);
    setEnquiryName(user?.name || user?.username || "");
    setEnquiryPhone(user?.mobile ? String(user.mobile) : "");
    setEnquiryEmail(user?.email || "");
    setEnquiryMessage(`Inquiry about ${option.metalType} Advance Booking (${option.percentage} advance, ${option.days} days duration).`);
    setEnquirySuccess(false);
    setTicketNumber("");
    setEnquiryModalVisible(true);
  };

  const submitEnquiry = async () => {
    if (!enquiryName.trim() || !enquiryPhone.trim() || !enquiryMessage.trim()) {
      Alert.alert(t("requiredFields"), t("pleaseFillRequiredFields"));
      return;
    }

    try {
      setSubmittingEnquiry(true);
      const payload: any = {
        name: enquiryName.trim(),
        phone: enquiryPhone.trim(),
        subject: "Advance Gold Inquiry",
        message: enquiryMessage.trim(),
        referenceType: "ADVANCE_BOOKING",
      };

      if (enquiryEmail.trim()) {
        payload.email = enquiryEmail.trim();
      }

      const response = await api.post("/tickets", payload);
      if (response.data && response.data.success) {
        setEnquirySuccess(true);
        setTicketNumber(response.data.data?.ticketNumber || "");
      } else {
        Alert.alert(t("enquiryFailed"), response.data?.message || t("enquiryFailed"));
      }
    } catch (error: any) {
      console.error("Error submitting enquiry:", error);
      Alert.alert(t("enquiryError"), error.response?.data?.error || t("anUnexpectedError"));
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const handleEnquire = (option: any) => {
    router.push({
      pathname: "/(app)/(tabs)/joinAdvGold",
      params: {
        advancePercent: option.percentage.replace("%", ""),
        metalType: option.metalType
      },
    });
  };

  const handleButtonPress = (index: number) => {
    setPressedButton(index);
    setTimeout(() => setPressedButton(null), 200);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.navigate('/(app)/(tabs)/home')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
            {t("goldAdvance")}
          </ResponsiveText>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient
        colors={[theme.colors.quaternary, theme.colors.quaternary]}
        style={StyleSheet.absoluteFill}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          router.navigate('/(app)/(tabs)/home');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          {t("goldAdvance")}
        </ResponsiveText>
        <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/home/BookingHistory')} style={styles.historyButton}>
          <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.historyText}>{getCustomTranslation("viewHistory", t("history"))}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.titleContainer}>
          <ResponsiveText variant="title" weight="bold" color={theme.colors.primary} align="center" style={styles.mainTitle}>
            {t("secureTodaysRate")}
          </ResponsiveText>
          <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
            {t("bookGoldInAdvanceSubtitle")}
          </ResponsiveText>
          <View style={styles.decorativeLine} />
        </View>

        {/* Percentage Toggle Row */}
        <View style={styles.percentageSelectorContainer}>
          {options.map((option, index) => {
            const isSelected = index === selectedPercentIndex;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.percentTab,
                  isSelected && styles.percentTabActive,
                  option.metalType === 'SILVER' && isSelected && styles.percentTabActiveSilver
                ]}
                onPress={() => setSelectedPercentIndex(index)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.percentTabText,
                  isSelected && styles.percentTabTextActive
                ]}>
                  {option.percentage}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeOption && (
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handleInfo(activeOption)}
            activeOpacity={0.9}
          >
            {/* Glow Effect */}
            <View style={[styles.cardGlow, { backgroundColor: activeOption.metalType === 'SILVER' ? 'rgba(203, 213, 225, 0.3)' : 'rgba(218, 165, 32, 0.3)' }]} />

            <LinearGradient
              colors={activeOption.gradient}
              style={[
                styles.cardGradient,
                { borderColor: activeOption.metalType === 'SILVER' ? 'rgba(203, 213, 225, 0.35)' : 'rgba(218, 165, 32, 0.35)' }
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Glossy Overlay */}
              <LinearGradient
                colors={["rgba(255,255,255,0.12)", "transparent", "rgba(0,0,0,0.3)"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Card Top Section */}
              <View style={styles.cardHeaderNew}>
                <View style={styles.headerLeft}>
                  {/* Metal Badge */}
                  <View style={activeOption.metalType === 'SILVER' ? styles.metalBadgeSilver : styles.metalBadge}>
                    <Ionicons
                      name={activeOption.metalType === 'SILVER' ? "shield" : "ribbon"}
                      size={12}
                      color={activeOption.metalType === 'SILVER' ? "#cbd5e1" : "#FFD700"}
                    />
                    <Text style={activeOption.metalType === 'SILVER' ? styles.metalBadgeTextSilver : styles.metalBadgeText}>
                      {activeOption.metalType}
                    </Text>
                  </View>
                  <Text style={styles.percentageTextNew}>{activeOption.percentage}</Text>
                </View>

                <View style={styles.headerRight}>
                  <View style={styles.daysBadge}>
                    <Ionicons name="calendar-outline" size={12} color={COLORS.white} />
                    <Text style={styles.daysBadgeText}>{activeOption.days} {t("schemes.days").toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Card Divider Line */}
              <View style={styles.cardDivider} />

              {/* Card Body Section */}
              <View style={styles.cardBodyNew}>
                {/* Dynamic Limits & Payments Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailsCol}>
                    <Text style={styles.detailsLabel}>{getCustomTranslation("amountLimit", "AMOUNT LIMITS")}</Text>
                    <Text style={styles.detailsValue}>
                      {activeOption.minBookingAmount || activeOption.maxBookingAmount
                        ? `₹${activeOption.minBookingAmount ? activeOption.minBookingAmount.toLocaleString('en-IN') : '0'} - ₹${activeOption.maxBookingAmount ? activeOption.maxBookingAmount.toLocaleString('en-IN') : '∞'}`
                        : 'No Limit'
                      }
                    </Text>
                  </View>
                  <View style={styles.gridSeparator} />

                  <View style={styles.detailsCol}>
                    <Text style={styles.detailsLabel}>{getCustomTranslation("weightLimit", "WEIGHT LIMITS")}</Text>
                    <Text style={styles.detailsValue}>
                      {activeOption.minGram || activeOption.maxGram
                        ? `${activeOption.minGram || 0}g - ${activeOption.maxGram ? activeOption.maxGram + 'g' : '∞'}`
                        : 'No Limit'
                      }
                    </Text>
                  </View>
                </View>

                {/* 2-line Description */}
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {activeOption.details}
                </Text>

                {/* Actions Row */}
                <View style={styles.actionRowNew}>
                  <TouchableOpacity
                    style={styles.moreButtonNew}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenEnquiryModal(activeOption);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.moreButtonTextNew}>{t("enquireNow")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.enquireButtonNew}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleInfo(activeOption);
                    }}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={activeOption.metalType === 'SILVER' ? ["#e2e8f0", "#94a3b8"] : ["#FFD700", "#DAA520"]}
                      style={styles.buttonGradientNew}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={activeOption.metalType === 'SILVER' ? styles.buttonTextNewSilver : styles.buttonTextNew}>
                        {t("knowMore") || "Know More"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Active Bookings Section */}
        {userBookings.length > 0 && (
          <View style={styles.activeBookingsContainer}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp(1.5), marginTop: hp(1) }}>
              <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.primary} style={styles.activeBookingsTitle}>
                {getCustomTranslation("myActiveBookings", "My Active Bookings")}
              </ResponsiveText>
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/home/BookingHistory')}>
                <Text style={{ color: theme.colors.primary, fontSize: rf(11.5), fontWeight: "bold" }}>
                  {getCustomTranslation("viewAll", "View All")}
                </Text>
              </TouchableOpacity>
            </View>

            {userBookings.slice(0, 2).map((booking) => {
              const now = new Date();
              const expiry = new Date(booking.expiryDate);
              const remainingTime = expiry.getTime() - now.getTime();
              const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

              return (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.activeBookingCard}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(app)/(tabs)/home/BookingHistory')}
                >
                  <View style={styles.activeCardHeader}>
                    <View style={styles.activeHeaderLeft}>
                      <View style={styles.activeIconWrapper}>
                        <Ionicons name="diamond" size={16} color="#DAA520" />
                      </View>
                      <View>
                        <Text style={styles.activeWeightText}>
                          {Number(booking.goldWeight).toFixed(3)}g {booking.metalType || 'GOLD'}
                        </Text>
                        <Text style={styles.activeRateText}>
                          {t("lockedRateLabel") || "Locked Rate"}: ₹{Number(booking.ratePerGram).toLocaleString('en-IN')}/g
                        </Text>
                      </View>
                    </View>
                    <View style={styles.activeStatusBadge}>
                      <Text style={styles.activeStatusText}>
                        {booking.status === 'PARTIAL' ? 'PARTIAL' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activeGrid}>
                    <View style={styles.activeGridCol}>
                      <Text style={styles.activeGridLabel}>{t("contractValue") || "Value"}</Text>
                      <Text style={styles.activeGridValue}>
                        ₹{Number(booking.totalAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.activeGridCol}>
                      <Text style={styles.activeGridLabel}>{t("advancePaid") || "Paid"}</Text>
                      <Text style={styles.activeGridValue}>
                        ₹{Number(booking.bookingAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.activeGridCol}>
                      <Text style={styles.activeGridLabel}>{t("remainingBal") || "Remaining"}</Text>
                      <Text style={[styles.activeGridValue, styles.activeGridValueHighlight]}>
                        ₹{Number(booking.remainingAmount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.activeFooter}>
                    <Text style={styles.activeExpiryText}>
                      {remainingDays} {getCustomTranslation("daysLeft", "Days Left")}
                    </Text>
                    <View style={styles.viewDetailsBtn}>
                      <Text style={styles.viewDetailsText}>{getCustomTranslation("viewDetails", "View Details")}</Text>
                      <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom Sheet Details & Terms Modal */}
        <Modal 
          visible={modalVisible} 
          animationType="slide" 
          transparent 
          onRequestClose={handleCloseModal}
        >
          <View style={styles.bottomSheetOverlay}>
            <View style={styles.bottomSheetContent}>
              <LinearGradient colors={["#850111", "#6b0010"]} style={styles.modalHeader}>
                <ResponsiveText variant="title" size="sm" weight="bold" color={COLORS.white} style={{ flex: 1 }}>
                  {selectedOption ? `${selectedOption.metalType} ${t("goldAdvance")}` : t("advanceOptionDetails")}
                </ResponsiveText>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </LinearGradient>
              
              {selectedOption && (
                <View style={{ flex: 1 }}>
                  <ScrollView style={styles.bottomSheetBody} contentContainerStyle={{ paddingBottom: 30 }}>
                    <View style={styles.bottomSheetGrid}>
                      <View style={styles.bottomSheetCol}>
                        <Text style={styles.bottomSheetLabel}>{t("advancePercentLabel")?.replace(':', '')}</Text>
                        <Text style={styles.bottomSheetValue}>{selectedOption.percentage}</Text>
                      </View>
                      <View style={styles.bottomSheetSeparator} />
                      <View style={styles.bottomSheetCol}>
                        <Text style={styles.bottomSheetLabel}>{t("daysWithColon")?.replace(':', '')}</Text>
                        <Text style={styles.bottomSheetValue}>{selectedOption.days} Days</Text>
                      </View>
                      <View style={styles.bottomSheetSeparator} />
                      <View style={styles.bottomSheetCol}>
                        <Text style={styles.bottomSheetLabel}>{t("minPaymentLabel")?.replace(':', '')}</Text>
                        <Text style={styles.bottomSheetValue}>{selectedOption.minPayment}</Text>
                      </View>
                    </View>

                    <Text style={styles.bottomSheetSectionTitle}>Description</Text>
                    <Text style={styles.bottomSheetDescription}>{selectedOption.details}</Text>

                    <View style={styles.bottomSheetDivider} />

                    <Text style={styles.bottomSheetSectionTitle}>Limits</Text>
                    <View style={[styles.bottomSheetGrid, { marginTop: hp(0.5) }]}>
                      <View style={styles.bottomSheetCol}>
                        <Text style={styles.bottomSheetLabel}>Amount Limits</Text>
                        <Text style={styles.bottomSheetValue}>
                          {selectedOption.minBookingAmount || selectedOption.maxBookingAmount
                            ? `₹${selectedOption.minBookingAmount ? selectedOption.minBookingAmount.toLocaleString('en-IN') : '0'} - ₹${selectedOption.maxBookingAmount ? selectedOption.maxBookingAmount.toLocaleString('en-IN') : '∞'}`
                            : 'No Limit'
                          }
                        </Text>
                      </View>
                      <View style={styles.bottomSheetSeparator} />
                      <View style={styles.bottomSheetCol}>
                        <Text style={styles.bottomSheetLabel}>Weight Limits</Text>
                        <Text style={styles.bottomSheetValue}>
                          {selectedOption.minGram || selectedOption.maxGram
                            ? `${selectedOption.minGram || 0}g - ${selectedOption.maxGram ? selectedOption.maxGram + 'g' : '∞'}`
                            : 'No Limit'
                          }
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bottomSheetDivider} />

                    <Text style={styles.bottomSheetSectionTitle}>{t("termsAndConditions")}</Text>
                    {termsLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                      <Text style={styles.bottomSheetTermsText}>{termsContent}</Text>
                    )}
                  </ScrollView>

                  {/* Book Button Section */}
                  <View style={styles.bottomSheetFooter}>
                    <TouchableOpacity
                      style={styles.bottomSheetBookButton}
                      onPress={() => {
                        handleEnquire(selectedOption);
                        handleCloseModal();
                      }}
                    >
                      <Text style={styles.bottomSheetBookButtonText}>{t("bookNow")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

        {/* Enquiry Modal */}
        <Modal visible={enquiryModalVisible} animationType="slide" transparent onRequestClose={() => setEnquiryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient colors={["#850111", "#6b0010"]} style={styles.modalHeader}>
                <ResponsiveText variant="title" size="sm" weight="bold" color={COLORS.white} style={{ flex: 1 }}>
                  {t("enquiryNowTitle")}
                </ResponsiveText>
                <TouchableOpacity onPress={() => setEnquiryModalVisible(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.white} />
                </TouchableOpacity>
              </LinearGradient>

              <ScrollView contentContainerStyle={styles.enquiryModalBody} keyboardShouldPersistTaps="handled">
                {enquirySuccess ? (
                  <View style={styles.successContainer}>
                    <Ionicons name="checkmark-circle-outline" size={64} color="green" />
                    <ResponsiveText variant="title" size="sm" weight="bold" color="green" align="center" style={{ marginTop: 10 }}>
                      {t("enquirySubmitted")}
                    </ResponsiveText>
                    <Text style={styles.successText}>
                      {t("enquirySuccessMessage")}
                    </Text>
                    <Text style={styles.ticketNumberText}>
                      {t("ticketNumberLabel")} {ticketNumber}
                    </Text>
                    <TouchableOpacity style={styles.successCloseBtn} onPress={() => setEnquiryModalVisible(false)}>
                      <Text style={styles.successCloseBtnText}>{t("close")}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.inputLabel}>{t("nameLabel")} <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      value={enquiryName}
                      onChangeText={setEnquiryName}
                      placeholder={t("enterFullName")}
                      placeholderTextColor="gray"
                    />

                    <Text style={styles.inputLabel}>{t("phoneLabel")} <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      value={enquiryPhone}
                      onChangeText={setEnquiryPhone}
                      placeholder={t("enterMobileNumber")}
                      keyboardType="phone-pad"
                      placeholderTextColor="gray"
                    />

                    <Text style={styles.inputLabel}>{t("emailLabel")}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={enquiryEmail}
                      onChangeText={setEnquiryEmail}
                      placeholder={t("enterEmailOptional")}
                      keyboardType="email-address"
                      placeholderTextColor="gray"
                    />

                    <Text style={styles.inputLabel}>{t("messageLabel")} <Text style={{ color: "red" }}>*</Text></Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      value={enquiryMessage}
                      onChangeText={setEnquiryMessage}
                      placeholder={t("enterEnquiryDetails")}
                      multiline
                      numberOfLines={4}
                      placeholderTextColor="gray"
                    />

                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={submitEnquiry}
                      disabled={submittingEnquiry}
                    >
                      {submittingEnquiry ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={styles.submitButtonText}>{t("submitEnquiry")}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
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
    backgroundColor: QUATERNARY_COLOR,
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
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(133, 1, 17, 0.08)",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(133, 1, 17, 0.15)",
  },
  historyText: {
    fontSize: rf(11),
    fontWeight: "600",
    color: theme.colors.primary,
    marginLeft: 4,
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
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: rf(12),
    marginBottom: hp(2),
    color: "rgba(0, 0, 0, 0.6)",
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
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  cardHeaderNew: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(1.5),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(3),
  },
  percentageTextNew: {
    fontSize: rf(26),
    fontWeight: "800",
    color: COLORS.white,
  },
  metalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
    gap: 4,
  },
  metalBadgeSilver: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(186, 195, 201, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(186, 195, 201, 0.3)",
    gap: 4,
  },
  metalBadgeText: {
    color: "#FFD700",
    fontSize: rf(9),
    fontWeight: "bold",
  },
  metalBadgeTextSilver: {
    color: "#cbd5e1",
    fontSize: rf(9),
    fontWeight: "bold",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  daysBadgeText: {
    color: COLORS.white,
    fontSize: rf(9),
    fontWeight: "800",
  },
  infoButtonNew: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    padding: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: wp(5),
  },
  cardBodyNew: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 12,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginBottom: hp(1.2),
  },
  detailsCol: {
    flex: 1,
    alignItems: "center",
  },
  gridSeparator: {
    width: 1,
    height: hp(2.5),
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  detailsLabel: {
    fontSize: rf(8.5),
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailsValue: {
    fontSize: rf(11.5),
    color: COLORS.white,
    fontWeight: "700",
  },
  descriptionText: {
    fontSize: rf(11),
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: rf(16),
    marginBottom: hp(1.8),
  },
  actionRowNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: wp(3),
  },
  moreButtonNew: {
    flex: 0.35,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: hp(1.2),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  moreButtonTextNew: {
    color: COLORS.white,
    fontSize: rf(10.5),
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  enquireButtonNew: {
    flex: 0.65,
    borderRadius: 10,
    overflow: "hidden",
  },
  buttonGradientNew: {
    paddingVertical: hp(1.2),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonTextNew: {
    color: "#5D4037",
    fontSize: rf(11),
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonTextNewSilver: {
    color: "#1e293b",
    fontSize: rf(11),
    fontWeight: "800",
    letterSpacing: 0.5,
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
  enquiryModalBody: {
    padding: wp(5),
  },
  inputLabel: {
    fontSize: rf(11),
    fontWeight: "bold",
    color: theme.colors.textDark,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: rf(11.5),
    color: theme.colors.textDark,
    backgroundColor: "#fff",
  },
  textArea: {
    height: hp(10),
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: hp(1.4),
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: rf(11.5),
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  successText: {
    fontSize: rf(11),
    color: "gray",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  ticketNumberText: {
    fontSize: rf(12),
    fontWeight: "bold",
    color: theme.colors.textDark,
    marginTop: 15,
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  successCloseBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 10,
    marginTop: 25,
  },
  successCloseBtnText: {
    color: COLORS.white,
    fontSize: rf(11),
    fontWeight: "bold",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: "100%",
    height: "75%",
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bottomSheetBody: {
    flex: 1,
    padding: wp(5),
  },
  bottomSheetGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f9",
    borderRadius: 12,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    marginBottom: hp(2),
  },
  bottomSheetCol: {
    flex: 1,
    alignItems: "center",
  },
  bottomSheetSeparator: {
    width: 1,
    height: hp(3),
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  bottomSheetLabel: {
    fontSize: rf(9.5),
    color: "gray",
    fontWeight: "600",
    marginBottom: 4,
  },
  bottomSheetValue: {
    fontSize: rf(13),
    color: theme.colors.textDark,
    fontWeight: "bold",
  },
  bottomSheetSectionTitle: {
    fontSize: rf(14),
    fontWeight: "bold",
    color: theme.colors.primary,
    marginTop: hp(1.5),
    marginBottom: hp(0.8),
  },
  bottomSheetDescription: {
    fontSize: rf(12),
    color: "gray",
    lineHeight: rf(18),
    marginBottom: hp(1.5),
  },
  bottomSheetDivider: {
    height: 1,
    backgroundColor: "#e5e5e5",
    marginVertical: hp(1.5),
  },
  bottomSheetTermsText: {
    fontSize: rf(11.5),
    color: "#475569",
    lineHeight: rf(17),
  },
  bottomSheetFooter: {
    padding: wp(5),
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1.5),
    gap: 8,
  },
  checkboxTouch: {
    padding: 2,
  },
  checkboxText: {
    fontSize: rf(12),
    color: theme.colors.textDark,
    fontWeight: "500",
  },
  bottomSheetBookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: hp(1.4),
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSheetBookButtonDisabled: {
    opacity: 0.5,
  },
  bottomSheetBookButtonText: {
    color: COLORS.white,
    fontSize: rf(13),
    fontWeight: "bold",
  },
  activeBookingsContainer: {
    marginTop: hp(4),
    paddingTop: hp(2),
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  activeBookingsTitle: {
    fontSize: rf(15),
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  activeBookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.15)",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(1.5),
  },
  activeHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  activeIconWrapper: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: "rgba(218,165,32,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeWeightText: {
    fontSize: rf(13.5),
    fontWeight: "800",
    color: theme.colors.textDark,
  },
  activeRateText: {
    fontSize: rf(10),
    color: "rgba(0,0,0,0.5)",
    marginTop: 1,
  },
  activeStatusBadge: {
    backgroundColor: "rgba(218,165,32,0.12)",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: 8,
  },
  activeStatusText: {
    color: "#DAA520",
    fontWeight: "800",
    fontSize: rf(10),
  },
  activeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: hp(1.5),
  },
  activeGridCol: {
    flex: 1,
    alignItems: "flex-start",
  },
  activeGridLabel: {
    fontSize: rf(9),
    color: "rgba(0,0,0,0.45)",
    marginBottom: 2,
  },
  activeGridValue: {
    fontSize: rf(11.5),
    fontWeight: "700",
    color: theme.colors.textDark,
  },
  activeGridValueHighlight: {
    color: "#850111", // Deep Red for remaining amount
  },
  activeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  activeExpiryText: {
    fontSize: rf(10.5),
    color: "#B22222", // Firebrick color for urgency
    fontWeight: "700",
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: rf(11),
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  percentageSelectorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: wp(3),
    marginBottom: hp(3),
    flexWrap: "wrap",
  },
  percentTab: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: "rgba(133, 1, 17, 0.15)",
    minWidth: wp(18),
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  percentTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  percentTabActiveSilver: {
    backgroundColor: "#64748b",
    borderColor: "#64748b",
  },
  percentTabText: {
    fontSize: rf(12),
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  percentTabTextActive: {
    color: COLORS.white,
  },
});


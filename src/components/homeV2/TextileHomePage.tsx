import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { themeConfig } from "@/constants/theme.config";
import HeaderV2 from "./HeaderV2";
import FlashNewsV2 from "./FlashNewsV2";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface TextileHomePageProps {
  homeData?: any;
  collectionsData?: any[];
  sliderImages?: any[];
  refreshing?: boolean;
  onRefresh?: () => void;
  totalGoldSavings?: number;
  totalAmount?: number;
  kycStatus?: boolean | null;
  isKycLoading?: boolean;
  flashNews?: string[];
}

export const TextileHomePage: React.FC<TextileHomePageProps> = ({
  homeData,
  refreshing = false,
  onRefresh,
  totalAmount = 0,
  flashNews = [],
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { user, language } = useGlobalStore();
  const customerInvestments = useGlobalStore((state) => state.customerInvestments);
  const isTamil = language === "ta";

  // Active Chit Count
  const activeChitsCount = Array.isArray(customerInvestments) ? customerInvestments.length : 0;

  // Voucher Image Modal State
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  // Format currency
  const formatCurrency = (val: number | string): string => {
    const num = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, ""));
    if (isNaN(num)) return "0";
    return num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  };

  const userName = user?.name ? user.name.split(" ")[0] : "";

  // Theni Anantham Official Colors
  const primaryRed = themeConfig.primaryColor || "#D81E27";
  const goldenYellow = themeConfig.secondaryColor || "#FFD200";

  // Flash news messages
  const flashNewsMessages = useMemo(() => {
    if (flashNews && flashNews.length > 0) return flashNews;
    const raw = homeData?.data?.flashNews;
    if (Array.isArray(raw)) {
      return raw
        .map((item: any) => (typeof item === "string" ? item : item?.title || item?.description || ""))
        .filter(Boolean);
    }
    return [
      isTamil
        ? "தீபாவளி வருடாந்திர சீட்டு: 11 மாதம் தவணை செலுத்துங்கள் • 12-வது மாதம் தேனி ஆனந்தமே செலுத்தும்!"
        : "Deepavali Annual Chit Scheme: Pay 11 Months • 12th Month Incentive Paid by Theni Anantham!",
    ];
  }, [flashNews, homeData?.data?.flashNews, isTamil]);

  // Handle Call & WhatsApp
  const handleCall = () => {
    Linking.openURL(`tel:${themeConfig.mobile || "+917339366531"}`);
  };

  const handleWhatsApp = () => {
    const phone = (themeConfig.whatsapp || "+917339366531").replace(/[^\d]/g, "");
    const msg = encodeURIComponent(
      isTamil
        ? "வணக்கம் தேனி ஆனந்தம்! தீபாவளி வருடாந்திர சீட்டு பற்றிய விபரங்களை அறிய விரும்புகிறேன்."
        : "Hello Theni Anantham! I would like to enquire about the Deepavali Annual Chit Scheme."
    );
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const handleDirections = () => {
    const lat = themeConfig.latitude || 10.3673;
    const lng = themeConfig.longitude || 77.9803;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Header with Theni Anantham Branding */}
      <HeaderV2 />

      {/* 2. Flash News Ticker */}
      {flashNewsMessages.length > 0 && <FlashNewsV2 messages={flashNewsMessages} />}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryRed, goldenYellow]}
            tintColor={primaryRed}
          />
        }
      >
        {/* 3. HERO: Deepavali Chit Savings Vault Card */}
        <View style={styles.cardContainer}>
          <View style={styles.vaultWrapper}>
            <LinearGradient
              colors={[primaryRed, "#A81119", "#6A050B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.vaultCard}
            >
              {/* Background Silk Pattern Accents */}
              <View style={styles.patternCircleTop} />
              <View style={styles.patternCircleBottom} />

              {/* Top Row: User Greeting & 11+1 Bonus Badge */}
              <View style={styles.vaultTopRow}>
                <View style={styles.greetingContainer}>
                  <View style={styles.sparkleRow}>
                    <Ionicons name="sparkles" size={14} color={goldenYellow} />
                    <Text style={styles.greetingText}>
                      {userName
                        ? `${isTamil ? "வணக்கம்" : "Hello"}, ${userName}`
                        : isTamil
                          ? "தேனி ஆனந்தம்"
                          : "Theni Anantham"}
                    </Text>
                  </View>
                  <Text style={styles.schemeTitleText}>
                    {isTamil ? "தீபாவளி வருடாந்திர சீட்டு" : "Deepavali Annual Chit"}
                  </Text>
                </View>

                {/* 11+1 Bonus Badge */}
                <View style={styles.bonusBadge}>
                  <MaterialCommunityIcons name="gift-outline" size={13} color="#FFFFFF" />
                  <Text style={styles.bonusBadgeText}>
                    {isTamil ? "11 + 1 மாதம் போனஸ்" : "11 + 1 Month Bonus"}
                  </Text>
                </View>
              </View>

              {/* Middle Metrics: Total Saved & Active Chits */}
              <TouchableOpacity
                style={styles.metricsRow}
                onPress={() => router.push("/(app)/(tabs)/savings")}
                activeOpacity={0.88}
              >
                {/* Total Saved */}
                <View style={styles.metricItem}>
                  <View style={styles.metricLabelRow}>
                    <Ionicons name="wallet-outline" size={13} color={goldenYellow} />
                    <Text style={styles.metricLabelText}>
                      {isTamil ? "மொத்த சேமிப்பு" : "Total Accumulated"}
                    </Text>
                  </View>
                  <Text style={styles.metricAmountText}>₹ {formatCurrency(totalAmount)}</Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.metricDivider} />

                {/* Active Chits / Plan */}
                <View style={styles.metricItem}>
                  <View style={styles.metricLabelRow}>
                    <Ionicons name="card-outline" size={13} color={goldenYellow} />
                    <Text style={styles.metricLabelText}>
                      {isTamil ? "சீட்டுகள்" : "Chit Status"}
                    </Text>
                  </View>
                  <Text style={styles.metricPlanText}>
                    {activeChitsCount > 0
                      ? `${activeChitsCount} ${isTamil ? "சீட்டுகள்" : "Active"}`
                      : isTamil
                        ? "ரூ.500 / ரூ.1000 திட்டம்"
                        : "₹500 / ₹1000 Plans"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Due Date Alert Notice */}
              <View style={styles.dueNoticeContainer}>
                <Ionicons name="calendar-outline" size={13} color="#FFE680" />
                <Text style={styles.dueNoticeText}>
                  {isTamil
                    ? "தவணை காலம்: பிரதி மாதம் 1 முதல் 5-ம் தேதி வரை"
                    : "Due Window: 1st to 5th of every month"}
                </Text>
              </View>

              {/* Bottom Action Strip: Quick Pay & Passbook */}
              <View style={styles.vaultActionStrip}>
                <TouchableOpacity
                  style={styles.payChitButton}
                  onPress={() => router.push("/(app)/(tabs)/quick_join")}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[goldenYellow, "#E5BC00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.payChitGradient}
                  >
                    <Ionicons name="flash" size={15} color="#8A0C13" />
                    <Text style={styles.payChitText}>
                      {isTamil ? "தவணை செலுத்துக" : "Pay Installment"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.passbookButton}
                  onPress={() => router.push("/(app)/(tabs)/savings")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.passbookButtonText}>
                    {isTamil ? "பாஸ்புக்" : "Passbook"}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* 4. OFFICIAL BANNER: Deepavali Chit Scheme Spotlight */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.spotlightCard}
            onPress={() => router.push("/(app)/(tabs)/quick_join")}
            activeOpacity={0.92}
          >
            <Image
              source={require("../../../assets/images/theni_anantham/deepavali_chit_banner_1024x512.jpg")}
              style={styles.spotlightBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.85)"]}
              style={styles.spotlightOverlay}
            >
              <View style={styles.spotlightTextContainer}>
                <View style={styles.spotlightTag}>
                  <Text style={styles.spotlightTagText}>
                    {isTamil ? "தீபாவளி சிறப்பு திட்டம்" : "Deepavali Special Scheme"}
                  </Text>
                </View>
                <Text style={styles.spotlightTitle}>
                  {isTamil
                    ? "11 மாதம் தவணை செலுத்துங்கள் • 12-வது மாதம் இலவசம்!"
                    : "Pay 11 Months • 12th Month Free Incentive Bonus!"}
                </Text>
                <View style={styles.spotlightCtaRow}>
                  <Text style={styles.spotlightCtaText}>
                    {isTamil ? "இப்போதே இணையுங்கள்" : "Enroll Now in Scheme"}
                  </Text>
                  <Ionicons name="arrow-forward-circle" size={18} color={goldenYellow} />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 5. QUICK ACTIONS: 6 Corporate Textile Grid Items */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isTamil ? "விரைவு சேவைகள்" : "Quick Actions"}
          </Text>
          <View style={styles.actionsGrid}>
            {/* 1. Pay Chit */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => router.push("/(app)/(tabs)/quick_join")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(216, 30, 39, 0.1)" }]}>
                <Ionicons name="flash-outline" size={22} color={primaryRed} />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "தவணை\nசெலுத்த" : "Pay\nChit"}
              </Text>
            </TouchableOpacity>

            {/* 2. Join Scheme */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => router.push("/(app)/(tabs)/quick_join")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(255, 210, 0, 0.16)" }]}>
                <Ionicons name="add-circle-outline" size={22} color="#B8860B" />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "புதிய சீட்டு\nஇணைய" : "Join\nScheme"}
              </Text>
            </TouchableOpacity>

            {/* 3. Passbook */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => router.push("/(app)/(tabs)/savings")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(30, 58, 138, 0.1)" }]}>
                <Ionicons name="book-outline" size={22} color="#1E3A8A" />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "சீட்டு\nபாஸ்புக்" : "Digital\nPassbook"}
              </Text>
            </TouchableOpacity>

            {/* 4. Payment Receipts */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => router.push({ pathname: "/(app)/payment-history", params: { from: "home" } })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                <Ionicons name="receipt-outline" size={22} color="#059669" />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "கட்டண\nரசீதுகள்" : "Payment\nReceipts"}
              </Text>
            </TouchableOpacity>

            {/* 5. Showroom & Parking */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={handleDirections}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(216, 30, 39, 0.1)" }]}>
                <Ionicons name="car-outline" size={22} color={primaryRed} />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "திண்டுக்கல்\nஷோரூம்" : "Dindigul\nShowroom"}
              </Text>
            </TouchableOpacity>

            {/* 6. Refer & Win */}
            <TouchableOpacity
              style={styles.actionGridItem}
              onPress={() => router.push("/(app)/(tabs)/home/refer_earn")}
              activeOpacity={0.8}
            >
              <View style={[styles.actionIconBox, { backgroundColor: "rgba(147, 51, 234, 0.1)" }]}>
                <Ionicons name="gift-outline" size={22} color="#7C3AED" />
              </View>
              <Text style={styles.actionGridLabel} numberOfLines={2}>
                {isTamil ? "நண்பரை\nஅழைக்க" : "Refer\n& Win"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 6. SCHEME RULES CARD: 10 Golden Rules Voucher Summary */}
        <View style={styles.sectionContainer}>
          <View style={styles.rulesCard}>
            <View style={styles.rulesHeader}>
              <View style={styles.rulesBadge}>
                <Ionicons name="shield-checkmark" size={14} color={primaryRed} />
                <Text style={styles.rulesBadgeText}>
                  {isTamil ? "அதிகாரப்பூர்வ விதிமுறைகள்" : "Official Rules & Terms"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowVoucherModal(true)}
                style={styles.viewVoucherBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.viewVoucherBtnText}>
                  {isTamil ? "வவுச்சர் பார்க்க" : "View Voucher"}
                </Text>
                <Ionicons name="open-outline" size={13} color={primaryRed} />
              </TouchableOpacity>
            </View>

            <Text style={styles.rulesMainTitle}>
              {isTamil ? "தீபாவளி சீட்டின் 4 முக்கிய சிறப்பம்சங்கள்:" : "Key Highlights of the Chit Scheme:"}
            </Text>

            <View style={styles.ruleBulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.ruleBulletText}>
                {isTamil
                  ? "திட்டத்தில் ரூ.500 மற்றும் ரூ.1000 ஆகிய இரண்டு பிரிவுகள் உள்ளன."
                  : "Two budget plans available: ₹500 and ₹1,000 per month."}
              </Text>
            </View>

            <View style={styles.ruleBulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.ruleBulletText}>
                {isTamil
                  ? "பிரதி மாதம் 1 முதல் 5-ம் தேதிக்குள் தவணைத் தொகையை செலுத்த வேண்டும்."
                  : "Pay installments between the 1st and 5th of every month."}
              </Text>
            </View>

            <View style={styles.ruleBulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.ruleBulletText}>
                {isTamil
                  ? "11 மாதம் செலுத்தியதும், 12-வது மாதத்தை தேனி ஆனந்தமே ஊக்கத்தொகையாக வழங்கும்."
                  : "Pay 11 months continuously, 12th month is paid by Theni Anantham."}
              </Text>
            </View>

            <View style={styles.ruleBulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.ruleBulletText}>
                {isTamil
                  ? "பணமாகத் திருப்பித் தரப்பட மாட்டாது; முதிர்வில் ஜவுளிகளாக மட்டுமே கிடைக்கும்."
                  : "Strictly textile redemption; no cash refunds permitted under any conditions."}
              </Text>
            </View>

            {/* Tap to open high-res voucher image */}
            <TouchableOpacity
              style={styles.openVoucherBannerBtn}
              onPress={() => setShowVoucherModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={16} color="#FFFFFF" />
              <Text style={styles.openVoucherBannerBtnText}>
                {isTamil
                  ? "முழு விதிமுறை வவுச்சரை பெரிதாகப் பார்க்க (Click Here)"
                  : "View Full 10 Rules Voucher (High-Res)"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. DINDIGUL SHOWROOM & SUPPORT CARD */}
        <View style={styles.sectionContainer}>
          <View style={styles.showroomCard}>
            <View style={styles.showroomHeader}>
              <View style={styles.showroomIconCircle}>
                <Ionicons name="business" size={20} color={primaryRed} />
              </View>
              <View style={styles.showroomHeaderText}>
                <Text style={styles.showroomTitle}>
                  {isTamil ? "தேனி ஆனந்தம் - திண்டுக்கல்" : "Theni Anantham - Dindigul"}
                </Text>
                <Text style={styles.showroomAddress}>
                  {isTamil
                    ? "11, மெயின் ரோடு, வரதராஜ் ஷாப்பிங் காம்ப்ளக்ஸ், திண்டுக்கல்."
                    : "11, Main Road, Varadaraj Shopping Complex, Dindigul."}
                </Text>
              </View>
            </View>

            {/* Grand Parking Feature Pill */}
            <View style={styles.parkingPill}>
              <Ionicons name="checkmark-circle" size={15} color="#059669" />
              <Text style={styles.parkingPillText}>
                {isTamil ? "மிகப்பிரம்மாண்ட பார்க்கிங் வசதி உள்ளது" : "Grand Parking Facility Available"}
              </Text>
            </View>

            {/* Contact Action Buttons */}
            <View style={styles.showroomActionsRow}>
              <TouchableOpacity
                style={styles.showroomCallBtn}
                onPress={handleCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.showroomBtnText}>
                  {isTamil ? "அழைக்க" : "Call Store"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.showroomWhatsAppBtn}
                onPress={handleWhatsApp}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#FFFFFF" />
                <Text style={styles.showroomBtnText}>
                  {isTamil ? "வாட்ஸ்அப்" : "WhatsApp"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.showroomMapBtn}
                onPress={handleDirections}
                activeOpacity={0.85}
              >
                <Ionicons name="navigate" size={14} color={primaryRed} />
                <Text style={[styles.showroomBtnText, { color: primaryRed }]}>
                  {isTamil ? "வழித்தடம்" : "Map"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 8. SOCIAL MEDIA CHANNELS */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>
            {isTamil ? "எங்களுடன் இணையுங்கள்" : "Connect With Us"}
          </Text>
          <View style={styles.socialRow}>
            {/* Instagram */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => Linking.openURL("https://instagram.com/THENIANANTHAMDINIDIGUL")}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#833AB4", "#FD1D1D", "#FCB045"]}
                style={styles.socialGradient}
              >
                <Ionicons name="logo-instagram" size={22} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.socialText}>Instagram</Text>
            </TouchableOpacity>

            {/* Website */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => Linking.openURL(themeConfig.website || "https://www.thenianantham.com")}
              activeOpacity={0.8}
            >
              <View style={[styles.socialGradient, { backgroundColor: primaryRed }]}>
                <Ionicons name="globe-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.socialText}>Website</Text>
            </TouchableOpacity>

            {/* YouTube */}
            <TouchableOpacity
              style={styles.socialItem}
              onPress={() => Linking.openURL(themeConfig.youtubeUrl || "https://youtu.be/8RAhdn5b9Bw")}
              activeOpacity={0.8}
            >
              <View style={[styles.socialGradient, { backgroundColor: "#FF0000" }]}>
                <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.socialText}>YouTube</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 9. BRAND FOOTER */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerTagline}>
            {isTamil ? "தேனி ★ ஆனந்தம் • மகிழ்ச்சியின் ஆரம்பம்..." : "Theni Anantham • Happiness Begins..."}
          </Text>
          <Text style={styles.footerCopyright}>
            © 2026 Theni Anantham, Dindigul. All Rights Reserved.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://nexooai.in/")}
            activeOpacity={0.7}
            style={styles.poweredByRow}
          >
            <Text style={styles.poweredByLabel}>Powered by </Text>
            <Text style={[styles.poweredByValue, { color: primaryRed }]}>NexooAI Solutions</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL: Full-Screen Scheme Rules Voucher Viewer */}
      <Modal
        visible={showVoucherModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowVoucherModal(false)}
      >
        <SafeAreaView style={styles.voucherModalContainer}>
          <View style={styles.voucherModalHeader}>
            <Text style={styles.voucherModalTitle}>
              {isTamil ? "தீபாவளி சீட்டு விதிமுறைகள்" : "Chit Scheme Rules Voucher"}
            </Text>
            <TouchableOpacity
              style={styles.voucherModalCloseBtn}
              onPress={() => setShowVoucherModal(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.voucherModalScroll}
            maximumZoomScale={3}
            minimumZoomScale={1}
            showsVerticalScrollIndicator={false}
          >
            <Image
              source={require("../../../assets/images/theni_anantham/scheme_rules_voucher.jpg")}
              style={styles.voucherFullImage}
              resizeMode="contain"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F9F8F6",
  },
  scrollContent: {
    paddingBottom: moderateScale(20),
  },

  // 1. Vault Card Styles
  cardContainer: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(10),
  },
  vaultWrapper: {
    borderRadius: moderateScale(20),
    shadowColor: "#D81E27",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  vaultCard: {
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    position: "relative",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 210, 0, 0.4)",
  },
  patternCircleTop: {
    position: "absolute",
    width: moderateScale(180),
    height: moderateScale(180),
    borderRadius: moderateScale(90),
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    top: -moderateScale(60),
    right: -moderateScale(40),
  },
  patternCircleBottom: {
    position: "absolute",
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    backgroundColor: "rgba(255, 210, 0, 0.06)",
    bottom: -moderateScale(50),
    left: -moderateScale(30),
  },
  vaultTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  greetingContainer: {
    flex: 1,
  },
  sparkleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  greetingText: {
    fontSize: moderateScale(12),
    color: "#FFE57F",
    fontWeight: "600",
  },
  schemeTitleText: {
    fontSize: moderateScale(17),
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  bonusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(12),
    borderWidth: 0.8,
    borderColor: "rgba(255, 210, 0, 0.5)",
  },
  bonusBadgeText: {
    fontSize: moderateScale(10),
    color: "#FFFFFF",
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    marginVertical: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  metricItem: {
    flex: 1,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  metricLabelText: {
    fontSize: moderateScale(11),
    color: "#FFE57F",
    fontWeight: "600",
  },
  metricAmountText: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  metricPlanText: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  metricDivider: {
    width: 1,
    height: moderateScale(36),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: moderateScale(10),
  },
  dueNoticeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: moderateScale(12),
    paddingHorizontal: moderateScale(4),
  },
  dueNoticeText: {
    fontSize: moderateScale(11),
    color: "#FFE680",
    fontWeight: "600",
  },
  vaultActionStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: moderateScale(10),
  },
  payChitButton: {
    flex: 1.3,
    borderRadius: moderateScale(12),
    overflow: "hidden",
  },
  payChitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    gap: 6,
  },
  payChitText: {
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#7D080E",
  },
  passbookButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  passbookButtonText: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 2. Spotlight Banner Styles
  sectionContainer: {
    paddingHorizontal: moderateScale(16),
    marginTop: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: moderateScale(10),
  },
  spotlightCard: {
    borderRadius: moderateScale(18),
    overflow: "hidden",
    height: moderateScale(180),
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  spotlightBannerImage: {
    width: "100%",
    height: "100%",
  },
  spotlightOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "flex-end",
    padding: moderateScale(14),
  },
  spotlightTextContainer: {
    gap: 4,
  },
  spotlightTag: {
    alignSelf: "flex-start",
    backgroundColor: "#D81E27",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  spotlightTagText: {
    fontSize: moderateScale(10),
    fontWeight: "800",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  spotlightTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 18,
  },
  spotlightCtaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  spotlightCtaText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#FFD200",
  },

  // 3. Quick Actions Grid
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: moderateScale(10),
  },
  actionGridItem: {
    width: (SCREEN_WIDTH - moderateScale(32) - moderateScale(20)) / 3,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(6),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F0EFEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIconBox: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  actionGridLabel: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    lineHeight: 14,
  },

  // 4. Rules Voucher Card
  rulesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rulesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(8),
  },
  rulesBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rulesBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: "800",
    color: "#D81E27",
  },
  viewVoucherBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewVoucherBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#D81E27",
  },
  rulesMainTitle: {
    fontSize: moderateScale(13),
    fontWeight: "700",
    color: "#111827",
    marginBottom: moderateScale(8),
  },
  ruleBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(6),
    gap: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D81E27",
    marginTop: 6,
  },
  ruleBulletText: {
    flex: 1,
    fontSize: moderateScale(12),
    color: "#4B5563",
    lineHeight: 17,
  },
  openVoucherBannerBtn: {
    marginTop: moderateScale(8),
    backgroundColor: "#D81E27",
    borderRadius: moderateScale(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(8),
    gap: 6,
  },
  openVoucherBannerBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 5. Showroom & Parking Card
  showroomCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(18),
    padding: moderateScale(14),
    borderWidth: 1.2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  showroomHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: moderateScale(8),
  },
  showroomIconCircle: {
    width: moderateScale(38),
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: "rgba(216, 30, 39, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  showroomHeaderText: {
    flex: 1,
  },
  showroomTitle: {
    fontSize: moderateScale(14),
    fontWeight: "800",
    color: "#111827",
  },
  showroomAddress: {
    fontSize: moderateScale(11),
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 15,
  },
  parkingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingVertical: moderateScale(5),
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(10),
    alignSelf: "flex-start",
    marginBottom: moderateScale(12),
  },
  parkingPillText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#047857",
  },
  showroomActionsRow: {
    flexDirection: "row",
    gap: moderateScale(8),
  },
  showroomCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#D81E27",
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  showroomWhatsAppBtn: {
    flex: 1.1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#25D366",
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
  },
  showroomMapBtn: {
    flex: 0.9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingVertical: moderateScale(8),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: "#D81E27",
  },
  showroomBtnText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // 6. Social Channels
  socialRow: {
    flexDirection: "row",
    gap: moderateScale(12),
  },
  socialItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: moderateScale(14),
    paddingVertical: moderateScale(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  socialGradient: {
    width: moderateScale(42),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(6),
  },
  socialText: {
    fontSize: moderateScale(11),
    fontWeight: "700",
    color: "#4B5563",
  },

  // 7. Footer
  footerContainer: {
    alignItems: "center",
    paddingVertical: moderateScale(20),
    gap: 4,
  },
  footerTagline: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#6B7280",
  },
  footerCopyright: {
    fontSize: moderateScale(10),
    color: "#9CA3AF",
  },
  poweredByRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  poweredByLabel: {
    fontSize: moderateScale(10),
    color: "#9CA3AF",
  },
  poweredByValue: {
    fontSize: moderateScale(10),
    fontWeight: "800",
  },

  // 8. Modal Voucher
  voucherModalContainer: {
    flex: 1,
    backgroundColor: "#111827",
  },
  voucherModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  voucherModalTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  voucherModalCloseBtn: {
    padding: 6,
  },
  voucherModalScroll: {
    flex: 1,
  },
  voucherFullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
});

export default TextileHomePage;

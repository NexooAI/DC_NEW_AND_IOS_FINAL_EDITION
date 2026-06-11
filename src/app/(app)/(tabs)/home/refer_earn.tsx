import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  Linking,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import useGlobalStore from "@/store/global.store";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

const { width } = Dimensions.get("window");

export default function ReferCodeScreen() {
  const { t } = useTranslation();
  const { user } = useGlobalStore();
  const code = user?.referralCode || "DEFAULT123";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(t("refer_earn_tab_refer") || "Refer & Earn");

  // Animation value for tab transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [activeTab]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t("copied") || "Copied", t("referral_code_copied") || "Referral Code Copied");
  };

  const shareMessage = (t("refer_earn_share_message") || "Use my referral code {code} to sign up and earn rewards! Click here to download the app: https://dcjewellers.org/refer?code={code}").replace(/{code}/g, code);

  const onShare = async () => {
    try {
      await Share.share({
        title: "Refer & Earn",
        message: shareMessage,
      });
    } catch (error: any) {
      Alert.alert(t("error") || "Error", error.message);
    }
  };

  const onShareWhatsapp = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(t("error") || "Error", "Make sure WhatsApp is installed on your device");
    });
  };

  // Carousel State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    if (slideSize > 0) {
      const index = event.nativeEvent.contentOffset.x / slideSize;
      const roundIndex = Math.round(index);

      // Ensure the index is valid and within bounds before updating state
      if (!isNaN(roundIndex) && roundIndex >= 0 && roundIndex < banners.length) {
        if (currentBannerIndex !== roundIndex) {
          setCurrentBannerIndex(roundIndex);
        }
      }
    }
  };

  const banners = [
    { title: t("refer_earn_banner_1") || "Share the Wealth with Friends" },
    { title: t("refer_earn_banner_2") || "Invite your friends and earn up to 250 points on their first payment." },
    { title: t("refer_earn_banner_3") || "Grow together and enjoy exclusive referral bonuses." }
  ];

  const faqs = [
    { q: t("refer_earn_faq_limit_q"), a: t("refer_earn_faq_limit_a") },
    { q: t("refer_earn_faq_wallet_q"), a: t("refer_earn_faq_wallet_a") },
    { q: t("refer_earn_faq_credited_q"), a: t("refer_earn_faq_credited_a") },
    { q: t("refer_earn_faq_receive_q"), a: t("refer_earn_faq_receive_a") },
    { q: t("refer_earn_faq_share_q"), a: t("refer_earn_faq_share_a") },
    { q: t("refer_earn_faq_withdraw_q"), a: t("refer_earn_faq_withdraw_a") },
    { q: t("refer_earn_faq_cancel_q"), a: t("refer_earn_faq_cancel_a") },
    { q: t("refer_earn_faq_later_q"), a: t("refer_earn_faq_later_a") },
    { q: t("refer_earn_faq_amount_q"), a: t("refer_earn_faq_amount_a") },
    { q: t("refer_earn_faq_program_q"), a: t("refer_earn_faq_program_a") },
  ];

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const renderFaqs = () => {
    return (
      <View style={styles.faqContainer}>
        <View style={styles.totalEarningsHeader}>
          <View>
            <Text style={styles.earningsLabel}>{t("refer_earn_total_earnings") || "Total Earnings"}</Text>
            <View style={styles.earningsValueRow}>
              <Ionicons name="star" size={24} color="#FF9800" />
              <Text style={styles.earningsValue}>0 {t("refer_earn_points") || "Points"}</Text>
            </View>
          </View>
          <FontAwesome5 name="gem" size={32} color="#9C27B0" />
        </View>

        {faqs.map((faq, index) => {
          const isExpanded = expandedFaq === index;
          return (
            <TouchableOpacity
              key={index}
              style={styles.faqItem}
              onPress={() => setExpandedFaq(isExpanded ? null : index)}
              activeOpacity={0.8}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#333" />
              </View>
              {isExpanded && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={{ height: 100 }} />
      </View>
    );
  };

  const renderReferAndEarn = () => (
    <View style={styles.referContent}>
      {/* Hero Banner Carousel */}
      <View>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.carouselScroll}
        >
          {banners.map((banner, index) => (
            <View key={index} style={styles.heroBanner}>
              <Text style={styles.heroSubtitle}>{t("store_name") || "ELITE KP JEWELLERS"}</Text>
              <Text style={styles.heroTitle}>
                {banner.title}
              </Text>
            </View>
          ))}
        </ScrollView>
        <View style={styles.paginationContainer}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentBannerIndex === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>
      </View>

      {/* How It Works Section */}
      <View style={[styles.howItWorksCard, { marginTop: 30 }]}>
        <View style={styles.timelineRow}>
          <View style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <Ionicons name="gift-outline" size={24} color="#850111" />
            </View>
            <Text style={styles.timelineText}>{t("refer_earn_invite_friends") || "Invite Your Friends"}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <Ionicons name="person-add-outline" size={24} color="#850111" />
            </View>
            <Text style={styles.timelineText}>{t("refer_earn_friends_join") || "Friends Join & Pay First Payment"}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>

          <View style={styles.timelineItem}>
            <View style={styles.timelineIconContainer}>
              <Ionicons name="star-outline" size={24} color="#850111" />
            </View>
            <Text style={styles.timelineText}>{t("refer_earn_you_earn") || "You Earn Rewards & Points!"}</Text>
          </View>
        </View>
      </View>

      {/* Rewards Title */}
      <Text style={styles.sectionTitle}>{t("refer_earn_rewards_you_get") || "Rewards You Get"}</Text>

      {/* Rewards List */}
      <View
        style={{
          marginHorizontal: 4,
          marginBottom: 24,
          borderRadius: 20,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(212, 175, 55, 0.3)',
        }}
      >
        {/* Card Header Gradient */}
        <LinearGradient
          colors={["#FFD700", "#F5DEB3"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{
            width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.7)',
            justifyContent: 'center', alignItems: 'center', marginBottom: 12
          }}>
            <FontAwesome5 name="gift" size={28} color={theme.colors.primary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.colors.primary }}>
            {t("premium_reward_tiers") || "Premium Reward Tiers"}
          </Text>
          <Text style={{ fontSize: 13, color: theme.colors.primary, opacity: 0.8, marginTop: 4, textAlign: 'center' }}>
            {t("premium_reward_tiers_desc") || "Your rewards scale with your friend's first payment amount"}
          </Text>
        </LinearGradient>

        {/* Tiers Content */}
        <View style={{ padding: 20, backgroundColor: '#fff' }}>

          {/* Tier 1 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFBE6',
              justifyContent: 'center', alignItems: 'center', marginRight: 16
            }}>
              <FontAwesome5 name="coins" size={20} color="#d4af37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 2, fontWeight: '600' }}>
                {t("tier_1_amount") || "₹100 to ₹1,000"}
              </Text>
              <Text style={{ fontSize: 16, color: '#1a1a1a', fontWeight: '700' }}>
                Earn <Text style={{ color: '#004B40', fontWeight: '800' }}>50 Points</Text>
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#f0f0f0', marginLeft: 64, marginBottom: 20 }} />

          {/* Tier 2 */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFBE6',
              justifyContent: 'center', alignItems: 'center', marginRight: 16
            }}>
              <FontAwesome5 name="coins" size={20} color="#d4af37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 2, fontWeight: '600' }}>
                {t("tier_2_amount") || "₹1,000 to ₹10,000"}
              </Text>
              <Text style={{ fontSize: 16, color: '#1a1a1a', fontWeight: '700' }}>
                Earn <Text style={{ color: '#004B40', fontWeight: '800' }}>250 Points</Text>
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: '#f0f0f0', marginLeft: 64, marginBottom: 20 }} />

          {/* Tier 3 */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFBE6',
              justifyContent: 'center', alignItems: 'center', marginRight: 16
            }}>
              <FontAwesome5 name="percentage" size={20} color="#d4af37" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: '#666', marginBottom: 2, fontWeight: '600' }}>
                {t("tier_3_amount") || "Above ₹10,000"}
              </Text>
              <Text style={{ fontSize: 16, color: '#1a1a1a', fontWeight: '700' }}>
                Earn <Text style={{ color: '#004B40', fontWeight: '800' }}>2% of Amount</Text>
              </Text>
            </View>
          </View>

        </View>
      </View>

      {/* Referral Code Display */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>{t("refer_earn_your_code") || "Your Code:"}</Text>
        <Text style={styles.codeValue}>{code}</Text>
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyIcon}>
          <Ionicons name="copy-outline" size={20} color="#850111" />
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activeTab}</Text>
        <TouchableOpacity style={styles.historyButton}>
          <Text style={styles.historyText}>{t("refer_earn_history") || "History"}</Text>
        </TouchableOpacity>
      </View> */}

      <View style={[styles.tabsContainer, { backgroundColor: '#fff', zIndex: 10 }]}>
        {[
          t("refer_earn_tab_refer") || "Refer & Earn",
          t("refer_earn_tab_referrals") || "My Referrals",
          t("refer_earn_tab_faqs") || "FAQS"
        ].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabItem,
              activeTab === tab && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === (t("refer_earn_tab_refer") || "Refer & Earn") && renderReferAndEarn()}
          {activeTab === (t("refer_earn_tab_faqs") || "FAQS") && renderFaqs()}
          {activeTab === (t("refer_earn_tab_referrals") || "My Referrals") && (
            <View style={{ padding: 20, alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="people-outline" size={50} color="#ccc" />
              <Text style={{ marginTop: 10, color: '#666' }}>{(t("refer_earn_content_coming_soon") || "Content coming soon for {tab}").replace("{tab}", activeTab)}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.whatsappButton} onPress={onShareWhatsapp}>
          <FontAwesome5 name="whatsapp" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappButtonText}>{t("refer_earn_whatsapp_invite") || "Invite Friends On Whatsapp"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Ionicons name="share-social-outline" size={22} color="#128C7E" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0', backgroundColor: '#fff',
    marginTop: Platform.OS === 'android' ? 30 : 0
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },
  historyButton: { padding: 4 },
  historyText: { fontSize: 14, color: '#850111', fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingHorizontal: 16 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabItemActive: {},
  tabText: { fontSize: 13, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#004B40', fontWeight: '700' }, // Dark green for active tab
  tabIndicator: { position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, backgroundColor: '#004B40', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  scrollView: { flex: 1, backgroundColor: "#fafafa" },
  scrollContent: { paddingBottom: 20 },
  referContent: { padding: 16, paddingTop: 8 },

  carouselScroll: { width: width - 32, borderRadius: 16 },
  heroBanner: {
    width: width - 32,
    backgroundColor: '#FFF2CC',
    borderRadius: 16,
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  heroSubtitle: { fontSize: 12, fontWeight: '700', color: '#444', letterSpacing: 1.5, marginBottom: 12, textTransform: 'uppercase' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#333', textAlign: 'center', lineHeight: 28 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: -20, marginBottom: 15, zIndex: 10 },
  paginationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.1)', marginHorizontal: 4 },
  paginationDotActive: { backgroundColor: '#850111', width: 20 },

  howItWorksCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  timelineItem: { flex: 1, alignItems: 'center' },
  timelineIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF8F0', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#FFE4C4' },
  timelineText: { fontSize: 11, textAlign: 'center', color: '#555', lineHeight: 16, fontWeight: '500' },
  arrowContainer: { paddingTop: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16, marginLeft: 4 },
  rewardsList: { gap: 12, marginBottom: 24 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  rewardIconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFBE6', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  rewardText: { flex: 1, fontSize: 14, color: '#444', lineHeight: 20 },
  boldText: { fontWeight: '700', color: '#000' },
  codeContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed', alignSelf: 'center', minWidth: '70%' },
  codeLabel: { fontSize: 14, color: '#666', marginRight: 8 },
  codeValue: { fontSize: 20, fontWeight: '800', color: '#850111', letterSpacing: 2, marginRight: 12 },
  copyIcon: { padding: 4 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  whatsappButton: { flex: 1, flexDirection: 'row', backgroundColor: '#004B40', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, marginRight: 12 },
  whatsappButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareButton: { width: 50, height: 50, borderWidth: 1, borderColor: '#004B40', borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F8' },

  faqContainer: { padding: 16, backgroundColor: '#fafafa' },
  totalEarningsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFDF5', padding: 20, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#F5E6B3' },
  earningsLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  earningsValueRow: { flexDirection: 'row', alignItems: 'center' },
  earningsValue: { fontSize: 24, fontWeight: '800', color: '#004B40', marginLeft: 8 },
  faqItem: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#eaeaea', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: '#333', flex: 1, paddingRight: 16 },
  faqAnswer: { fontSize: 14, color: '#666', marginTop: 12, lineHeight: 22, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 }
});

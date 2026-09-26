import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useAppTheme } from '@/store/global.store';
import useGlobalStore from '@/store/global.store';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppVisibility } from '@/hooks/useAppVisibility';
import { responsiveUtils } from '@/utils/responsiveUtils';
import ScreenHeader from '@/components/ScreenHeader';
import { getImageSource, getFullImageUrl } from '@/utils/imageUtils';
import GiftService, { CustomerGift, GiftRule } from '@/services/giftService';
import { showToast } from '@/services/notification';

const { wp, hp, rf } = responsiveUtils;

type TabType = 'my_gifts' | 'offers' | 'how_to_claim';

export default function GiftsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalStore();
  const { isVisible } = useAppVisibility();

  const userId = (user as any)?.userId || user?.id;

  const [activeTab, setActiveTab] = useState<TabType>('my_gifts');
  const [gifts, setGifts] = useState<CustomerGift[]>([]);
  const [rules, setRules] = useState<GiftRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGift, setSelectedGift] = useState<CustomerGift | null>(null);

  // Hardware back press handler
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/(tabs)/home');
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => sub.remove();
    }, [handleBack])
  );

  // Fetch gifts & rules
  const fetchData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      try {
        const [giftsRes, rulesRes] = await Promise.all([
          userId ? GiftService.getMyGifts(userId) : Promise.resolve([]),
          GiftService.getGiftRules()
        ]);
        setGifts(giftsRes || []);
        setRules(rulesRes || []);
      } catch (err) {
        console.error('Error fetching gifts data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useFocusEffect(
    useCallback(() => {
      if (!isVisible('showGifts')) {
        handleBack();
        return;
      }
      fetchData(true);
    }, [fetchData, isVisible, handleBack])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(false);
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    showToast(`${text} copied to clipboard`, 'success');
  };

  const formatCurrency = (val?: number | string | null) => {
    const num = Number(val) || 0;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Helper for status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return {
          label: t('giftDelivered') || 'Delivered',
          bgColor: '#E6F4EA',
          textColor: '#137333',
          borderColor: '#A8DAB5',
          icon: 'checkmark-circle'
        };
      case 'ELIGIBLE':
      default:
        return {
          label: t('eligibleForPickup') || 'Ready for Pickup',
          bgColor: '#FEF7E0',
          textColor: '#B06000',
          borderColor: '#FEEFC3',
          icon: 'time'
        };
    }
  };

  // Render My Gifts Card
  const renderGiftItem = ({ item }: { item: CustomerGift }) => {
    const statusMeta = getStatusBadge(item.status);
    const giftImg = item.image_url || item.gift_image_url;

    return (
      <View style={[styles.card, { borderColor: theme.colors.border || '#e5e7eb' }]}>
        <View style={styles.cardTopRow}>
          {/* Gift Image or Fallback */}
          <View style={styles.giftImageWrapper}>
            {giftImg ? (
              <Image
                source={getImageSource(giftImg) ?? { uri: getFullImageUrl(giftImg) }}
                style={styles.giftImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.giftImagePlaceholder}
              >
                <Ionicons name="gift" size={36} color="#D97706" />
              </LinearGradient>
            )}
          </View>

          {/* Gift Main Info */}
          <View style={styles.giftMainInfo}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusMeta.bgColor, borderColor: statusMeta.borderColor }
                ]}
              >
                <Ionicons
                  name={statusMeta.icon as any}
                  size={12}
                  color={statusMeta.textColor}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.statusText, { color: statusMeta.textColor }]}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>

            <Text style={[styles.giftNameText, { color: theme.colors.textDark || '#111827' }]} numberOfLines={2}>
              {item.gift_name}
            </Text>

            {item.scheme_name && (
              <Text style={styles.schemeNameText} numberOfLines={1}>
                {item.scheme_name}
              </Text>
            )}

            {item.estimated_value && Number(item.estimated_value) > 0 && (
              <Text style={styles.estimatedValueText}>
                {t('estimatedValue') || 'Est. Value'}: {formatCurrency(item.estimated_value)}
              </Text>
            )}
          </View>
        </View>

        {/* Card Details / Ledger Rows */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('schemeAccount') || 'Account No'}:</Text>
            <TouchableOpacity
              style={styles.copyRow}
              onPress={() => item.accountNo && copyToClipboard(item.accountNo)}
              activeOpacity={0.7}
            >
              <Text style={[styles.detailValue, { color: theme.colors.primary || '#0b162c' }]}>
                {item.accountNo || 'N/A'}
              </Text>
              {item.accountNo && (
                <Ionicons name="copy-outline" size={13} color={theme.colors.primary || '#0b162c'} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('joiningAmount') || 'Joining Amount'}:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.joining_amount)}</Text>
          </View>

          {item.status === 'DELIVERED' ? (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('handoverDate') || 'Delivered On'}:</Text>
                <Text style={[styles.detailValue, { color: '#137333' }]}>
                  {formatDate(item.handover_date)}
                </Text>
              </View>
              {item.delivered_branch_name && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('branch') || 'Branch'}:</Text>
                  <Text style={styles.detailValue}>{item.delivered_branch_name}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.pickupHintBox}>
              <Ionicons name="storefront-outline" size={16} color="#B06000" style={{ marginRight: 6 }} />
              <Text style={styles.pickupHintText}>
                {t('collectAtShowroom') || 'Visit any showroom with your Scheme Account No. to collect your gift.'}
              </Text>
            </View>
          )}
        </View>

        {/* Card Footer Actions */}
        {item.status === 'ELIGIBLE' && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.viewStoresBtn}
              onPress={() => router.push('/(app)/(tabs)/home/our_stores')}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate-outline" size={15} color={theme.colors.primary || '#0b162c'} />
              <Text style={[styles.viewStoresBtnText, { color: theme.colors.primary || '#0b162c' }]}>
                {t('viewShowrooms') || 'Find Showroom to Collect'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render Offer / Slab Card
  const renderRuleItem = ({ item }: { item: GiftRule }) => {
    return (
      <View style={[styles.offerCard, { borderColor: theme.colors.border || '#e5e7eb' }]}>
        <View style={styles.offerTopRow}>
          <View style={styles.offerImageWrapper}>
            {item.image_url ? (
              <Image
                source={getImageSource(item.image_url) ?? { uri: getFullImageUrl(item.image_url) }}
                style={styles.offerImage}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient colors={['#FDE68A', '#F59E0B']} style={styles.offerImagePlaceholder}>
                <Ionicons name="ribbon-outline" size={32} color="#78350F" />
              </LinearGradient>
            )}
          </View>

          <View style={styles.offerInfo}>
            <View style={styles.slabPill}>
              <Text style={styles.slabPillText}>
                {formatCurrency(item.min_joining_amount)}
                {Number(item.max_joining_amount) < 9999999 ? ` - ${formatCurrency(item.max_joining_amount)}` : '+'}
              </Text>
            </View>
            <Text style={[styles.offerGiftName, { color: theme.colors.textDark || '#111827' }]} numberOfLines={2}>
              {item.gift_name}
            </Text>
            <Text style={styles.offerSchemeText} numberOfLines={1}>
              {item.scheme_name || 'All Savings Schemes'}
            </Text>
            {item.estimated_value && Number(item.estimated_value) > 0 && (
              <Text style={styles.offerValueText}>
                {t('estimatedValue') || 'Worth'}: {formatCurrency(item.estimated_value)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.joinSchemeBtn, { backgroundColor: theme.colors.primary || '#0b162c' }]}
          onPress={() => router.push('/(app)/(tabs)/home/schemes')}
          activeOpacity={0.85}
        >
          <Text style={styles.joinSchemeBtnText}>
            {t('joinScheme') || 'Join Scheme & Get Gift'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render How to Claim Guide
  const renderHowToClaim = () => (
    <ScrollView
      contentContainerStyle={styles.howToClaimContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <LinearGradient
        colors={[theme.colors.quaternary || '#F2E6D2', '#FFFFFF']}
        style={styles.guideHero}
      >
        <Ionicons name="sparkles" size={28} color="#D97706" style={{ marginBottom: 6 }} />
        <Text style={[styles.guideHeroTitle, { color: theme.colors.textDark || '#0e1e38' }]}>
          {t('exclusiveJoiningGifts') || 'Exclusive Joining Gifts'}
        </Text>
        <Text style={styles.guideHeroSubtitle}>
          {t('exclusiveJoiningGiftsDesc') || 'Join any eligible savings scheme and receive verified showroom gifts!'}
        </Text>
      </LinearGradient>

      {/* Steps Timeline */}
      <View style={styles.stepsWrapper}>
        <View style={styles.stepCard}>
          <View style={styles.stepNumberBadge}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Enroll in a Gold Scheme</Text>
            <Text style={styles.stepDesc}>
              Choose your preferred savings scheme and make your 1st installment payment online or at any branch.
            </Text>
          </View>
        </View>

        <View style={styles.stepConnector} />

        <View style={styles.stepCard}>
          <View style={[styles.stepNumberBadge, { backgroundColor: '#F59E0B' }]}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Gift Automatically Allocated</Text>
            <Text style={styles.stepDesc}>
              Your joining gift will automatically appear in "My Gifts" with status "Ready for Pickup".
            </Text>
          </View>
        </View>

        <View style={styles.stepConnector} />

        <View style={styles.stepCard}>
          <View style={[styles.stepNumberBadge, { backgroundColor: '#10B981' }]}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Collect at Nearest Showroom</Text>
            <Text style={styles.stepDesc}>
              Visit any showroom, display your Scheme Account No. in the app, and collect your gift with photo proof!
            </Text>
          </View>
        </View>
      </View>

      {/* FAQs */}
      <View style={styles.faqSection}>
        <Text style={styles.faqSectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>When can I collect my gift?</Text>
          <Text style={styles.faqAnswer}>
            Your gift is eligible for pickup immediately once your 1st scheme installment payment is verified.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Which showroom should I visit?</Text>
          <Text style={styles.faqAnswer}>
            You can visit any of our official branches. Showroom staff will verify your scheme account number and record delivery.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>Is photo proof required?</Text>
          <Text style={styles.faqAnswer}>
            Yes, our showroom executive will take a quick photo of the handover to ensure 100% genuine and verified gift delivery.
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.guideCtaBtn, { backgroundColor: theme.colors.primary || '#0b162c' }]}
        onPress={() => router.push('/(app)/(tabs)/home/our_stores')}
        activeOpacity={0.85}
      >
        <Ionicons name="storefront-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.guideCtaBtnText}>{t('viewShowrooms') || 'Locate Showrooms'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background || '#F9FAFB' }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background || '#F9FAFB'} />

      {/* Screen Header */}
      <ScreenHeader
        title={t('schemeGifts') || 'Gifts'}
        onBack={handleBack}
      />

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'my_gifts' && styles.activeTabButton]}
          onPress={() => setActiveTab('my_gifts')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'my_gifts' && [styles.activeTabText, { color: theme.colors.primary || '#0b162c' }]]}>
            {t('myGifts') || 'My Gifts'}
          </Text>
          {gifts.length > 0 && (
            <View style={[styles.tabBadge, { backgroundColor: theme.colors.primary || '#0b162c' }]}>
              <Text style={styles.tabBadgeText}>{gifts.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'offers' && styles.activeTabButton]}
          onPress={() => setActiveTab('offers')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'offers' && [styles.activeTabText, { color: theme.colors.primary || '#0b162c' }]]}>
            {t('giftOffers') || 'Gift Offers'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'how_to_claim' && styles.activeTabButton]}
          onPress={() => setActiveTab('how_to_claim')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabButtonText, activeTab === 'how_to_claim' && [styles.activeTabText, { color: theme.colors.primary || '#0b162c' }]]}>
            {t('howToClaim') || 'How to Claim'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary || '#0b162c'} />
          <Text style={styles.loadingText}>Loading gifts...</Text>
        </View>
      ) : activeTab === 'my_gifts' ? (
        gifts.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          >
            <View style={styles.emptyIconCircle}>
              <Ionicons name="gift-outline" size={54} color="#D97706" />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.textDark || '#111827' }]}>
              {t('noGiftsFound') || 'No scheme gifts allocated yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('noGiftsSubtitle') || 'Join any gold savings scheme today to earn exclusive joining gifts!'}
            </Text>

            <TouchableOpacity
              style={[styles.emptyActionBtn, { backgroundColor: theme.colors.primary || '#0b162c' }]}
              onPress={() => router.push('/(app)/(tabs)/home/schemes')}
              activeOpacity={0.85}
            >
              <Text style={styles.emptyActionBtnText}>{t('joinScheme') || 'Explore Schemes'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <FlatList
            data={gifts}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderGiftItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          />
        )
      ) : activeTab === 'offers' ? (
        <FlatList
          data={rules}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRuleItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="sparkles-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No active offers at the moment</Text>
              <Text style={styles.emptySubtitle}>Check back soon for festive and seasonal joining gift offers!</Text>
            </View>
          }
        />
      ) : (
        renderHowToClaim()
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: wp(3),
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.6),
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#0b162c',
  },
  tabButtonText: {
    fontSize: rf(13.5),
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    fontWeight: '700',
  },
  tabBadge: {
    marginLeft: 6,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: rf(10),
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(5),
  },
  loadingText: {
    marginTop: 10,
    fontSize: rf(14),
    color: '#6B7280',
  },
  listContent: {
    padding: wp(4),
    paddingBottom: hp(6),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    padding: wp(3.8),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  giftImageWrapper: {
    width: wp(22),
    height: wp(22),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: wp(3.5),
  },
  giftImage: {
    width: '100%',
    height: '100%',
  },
  giftImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giftMainInfo: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusText: {
    fontSize: rf(11),
    fontWeight: '700',
  },
  giftNameText: {
    fontSize: rf(15),
    fontWeight: '700',
    marginBottom: 2,
  },
  schemeNameText: {
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: 2,
  },
  estimatedValueText: {
    fontSize: rf(12),
    color: '#D97706',
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: hp(1.5),
    paddingTop: hp(1.2),
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: rf(12.5),
    color: '#6B7280',
  },
  detailValue: {
    fontSize: rf(12.5),
    fontWeight: '600',
    color: '#1F2937',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: wp(2.5),
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pickupHintText: {
    flex: 1,
    fontSize: rf(11.5),
    color: '#92400E',
    lineHeight: 16,
  },
  cardFooter: {
    marginTop: hp(1.2),
  },
  viewStoresBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.2),
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  viewStoresBtnText: {
    fontSize: rf(12.5),
    fontWeight: '600',
    marginLeft: 6,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    padding: wp(3.8),
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  offerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  offerImageWrapper: {
    width: wp(20),
    height: wp(20),
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginRight: wp(3.5),
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  slabPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  slabPillText: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#B45309',
  },
  offerGiftName: {
    fontSize: rf(15),
    fontWeight: '700',
    marginBottom: 2,
  },
  offerSchemeText: {
    fontSize: rf(12),
    color: '#6B7280',
    marginBottom: 2,
  },
  offerValueText: {
    fontSize: rf(12),
    color: '#059669',
    fontWeight: '600',
  },
  joinSchemeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.3),
    borderRadius: 10,
  },
  joinSchemeBtnText: {
    color: '#FFFFFF',
    fontSize: rf(13.5),
    fontWeight: '700',
  },
  howToClaimContainer: {
    padding: wp(4),
    paddingBottom: hp(6),
  },
  guideHero: {
    borderRadius: 16,
    padding: wp(5),
    alignItems: 'center',
    marginBottom: hp(2.5),
  },
  guideHeroTitle: {
    fontSize: rf(18),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  guideHeroSubtitle: {
    fontSize: rf(13),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepsWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: '800',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: rf(14.5),
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: rf(12.5),
    color: '#6B7280',
    lineHeight: 17,
  },
  stepConnector: {
    width: 2,
    height: hp(3),
    backgroundColor: '#E5E7EB',
    marginLeft: 15,
    marginVertical: 4,
  },
  faqSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2.5),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqSectionTitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: hp(1.5),
  },
  faqItem: {
    marginBottom: hp(1.5),
  },
  faqQuestion: {
    fontSize: rf(13.5),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  faqAnswer: {
    fontSize: rf(12.5),
    color: '#6B7280',
    lineHeight: 17,
  },
  guideCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.6),
    borderRadius: 12,
  },
  guideCtaBtnText: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp(6),
    minHeight: hp(50),
  },
  emptyIconCircle: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontSize: rf(17),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: rf(13),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: hp(2.5),
    paddingHorizontal: wp(4),
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.4),
    borderRadius: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: rf(14),
    fontWeight: '700',
  },
});

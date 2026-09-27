import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  ScrollView,
  UIManager,
  StatusBar,
  BackHandler,
  ToastAndroid,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import COLORS from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useTranslation } from '@/hooks/useTranslation';
import apiWithLoader from '@/services/apiWithLoader';

// Enable LayoutAnimation for Android (only if not on the New Architecture / Fabric)
const isNewArch = (global as any).RN$Fabric || (global as any).nativeFabricUIManager;
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !isNewArch
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { wp, hp, rf } = responsiveUtils;

interface TransactionItem {
  id: number | string;
  userId: number | string;
  investmentId: number | string;
  schemeId: number | string;
  chitId?: number | string | null;
  installment: number;
  accountNumber?: string | null;
  paymentId?: string | null;
  orderId: string;
  amount: number | string;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate: string;
  createdAt: string;
  gatewayTransactionId?: string | null;
  isManual: string;
  utr_reference?: string | null;
  payment_method_type?: string | null;
  schemeName?: string | null;
  schemeType?: string | null;
}

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export default function PaymentHistoryScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const { t } = useTranslation();
  const { user } = useGlobalStore();

  const handleBack = useCallback(() => {
    try {
      if (params.from === 'home') {
        router.replace('/(app)/(tabs)/home');
      } else if (params.from === 'profile') {
        router.replace('/(app)/(tabs)/profile');
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(app)/(tabs)/profile');
      }
    } catch {
      router.replace('/(app)/(tabs)/profile');
    }
  }, [router, params.from]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [handleBack])
  );

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'success' | 'pending' | 'failed'>('all');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;

  const isSuccessStatus = (status: string) => {
    const s = String(status).toLowerCase();
    return s === 'success' || s === 'successful' || s === 'charged';
  };

  const isFailedStatus = (status: string) => {
    const s = String(status).toLowerCase();
    return s === 'failed' || s === 'failure' || s === 'fail' || s === 'cancelled' || s === 'authorization_failed' || s === 'authentication_failed';
  };

  const isPendingStatus = (status: string) => {
    return !isSuccessStatus(status) && !isFailedStatus(status);
  };

  const renderFilterChips = () => {
    const filters: Array<{ key: 'all' | 'success' | 'pending' | 'failed'; label: string }> = [
      { key: 'all', label: t('filterAll') || 'All' },
      { key: 'success', label: t('success') || 'Success' },
      { key: 'pending', label: t('pending') || 'Pending' },
      { key: 'failed', label: t('failed') || 'Failed' }
    ];

    return (
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((item) => {
            const isActive = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterChip,
                  isActive && styles.activeFilterChip
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }
                  setFilter(item.key);
                }}
              >
                <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const userId = (user as any)?.userId || user?.id;

  const fetchHistory = useCallback(async (currentOffset: number, currentFilter: string, showLoader = true) => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (currentOffset === 0) {
        if (showLoader) setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await apiWithLoader.payments.getPaymentHistory(
        String(userId),
        LIMIT,
        currentOffset,
        currentFilter
      );
      const list = response?.data?.data || [];
      const pagination = response?.data?.pagination;

      setTransactions((prev) => {
        if (currentOffset === 0) {
          return Array.isArray(list) ? list : [];
        } else {
          return Array.isArray(list) ? [...prev, ...list] : prev;
        }
      });

      if (pagination) {
        setHasMore(pagination.hasMore);
      } else {
        setHasMore(list.length === LIMIT);
      }
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      setOffset(0);
      fetchHistory(0, filter, true);
    }, [userId, filter, fetchHistory])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    setOffset(0);
    fetchHistory(0, filter, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextOffset = offset + LIMIT;
    setOffset(nextOffset);
    fetchHistory(nextOffset, filter, false);
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={theme.colors.secondary} />
        </View>
      );
    }
    if (hasMore) {
      return (
        <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
          <Text style={styles.loadMoreButtonText}>{t('loadMore') || 'Load More'}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const getStatusMeta = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'success':
      case 'successful':
      case 'charged':
        return {
          label: t('success') || 'SUCCESS',
          color: '#16A34A',
          amountColor: '#15803D',
          backgroundColor: '#ECFDF5',
          borderColor: '#86EFAC',
          accentColor: '#16A34A',
          icon: 'checkmark-circle' as const,
        };
      case 'failure':
      case 'failed':
      case 'fail':
      case 'authorization_failed':
      case 'authentication_failed':
        return {
          label: t('failed') || 'FAILED',
          color: '#DC2626',
          amountColor: '#B91C1C',
          backgroundColor: '#FEF2F2',
          borderColor: '#FCA5A5',
          accentColor: '#DC2626',
          icon: 'close-circle' as const,
        };
      case 'cancelled':
        return {
          label: t('cancelled') || 'CANCELLED',
          color: '#6B7280',
          amountColor: '#4B5563',
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
          accentColor: '#6B7280',
          icon: 'ban-outline' as const,
        };
      case 'pending':
      default:
        return {
          label: t('pending') || 'PENDING',
          color: '#D97706',
          amountColor: '#B45309',
          backgroundColor: '#FFFBEB',
          borderColor: '#FDE68A',
          accentColor: '#D97706',
          icon: 'time-outline' as const,
        };
    }
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${label} copied to clipboard!`, ToastAndroid.SHORT);
      }
    } catch {}
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.quaternary || '#F2E6D2' }]} />
        <LinearGradient colors={[theme.colors.quaternary, theme.colors.quaternary]} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
          </TouchableOpacity>
          <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.textDark}>
            {t('paymentHistory') || 'Payment History'}
          </ResponsiveText>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.guestContainer}>
          <Ionicons name="lock-closed-outline" size={rf(60)} color="rgba(0,0,0,0.2)" />
          <Text style={styles.guestText}>{t('pleaseLoginToContinue') || 'Please login to continue'}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginButtonText}>{t('goToLogin') || 'Go to Login'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderTransactionItem = ({ item }: { item: TransactionItem }) => {
    const statusMeta = getStatusMeta(item.paymentStatus);
    const amountVal = Number(item.amount) || 0;
    const isSuccess = isSuccessStatus(item.paymentStatus);
    const weightVal = Number((item as any).gold_weight || (item as any).weight || (item as any).metal_weight) || 0;
    const bonusVal = Number((item as any).bonus_amount) || 0;
    const refCode = item.gatewayTransactionId || item.utr_reference || item.orderId;

    return (
      <View style={[styles.card, { borderLeftColor: statusMeta.accentColor }]}>
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.schemeInfo}>
            <View style={styles.schemeTitleRow}>
              <Ionicons
                name="shield-checkmark"
                size={15}
                color={theme.colors.secondary || '#D4AF37'}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.schemeNameText} numberOfLines={1}>
                {item.schemeName || `Scheme #${item.schemeId}`}
              </Text>
            </View>
            <View style={styles.badgeRow}>
              {item.schemeType && (
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>
                    {item.schemeType.toUpperCase()}
                  </Text>
                </View>
              )}
              {item.accountNumber && (
                <Text style={styles.accountNumberText}>
                  A/C: {item.accountNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge with Icon */}
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.backgroundColor, borderColor: statusMeta.borderColor }]}>
            <Ionicons name={statusMeta.icon} size={12} color={statusMeta.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>{t('paymentAmount') || 'Payment Amount'}</Text>
              <Text style={[styles.amountText, { color: statusMeta.amountColor }]}>
                {isSuccess ? '+' : ''}₹{amountVal.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.paymentMethodContainer}>
              <View style={styles.paymentMethodBadge}>
                <Ionicons
                  name={String(item.paymentMethod || '').toLowerCase().includes('upi') ? 'qr-code-outline' : 'card-outline'}
                  size={12}
                  color={theme.colors.textSecondary || '#64748B'}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.paymentMethodText}>
                  {(item.paymentMethod || item.payment_method_type || 'ONLINE').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Bonus or Weight Accrued if present */}
          {(weightVal > 0 || bonusVal > 0) && (
            <View style={styles.rewardsRow}>
              {weightVal > 0 && (
                <View style={styles.weightBadge}>
                  <Ionicons name="sparkles" size={11} color="#B45309" style={{ marginRight: 4 }} />
                  <Text style={styles.weightBadgeText}>{weightVal}g Gold Credited</Text>
                </View>
              )}
              {bonusVal > 0 && (
                <View style={styles.bonusBadge}>
                  <Ionicons name="gift" size={11} color="#15803D" style={{ marginRight: 4 }} />
                  <Text style={styles.bonusBadgeText}>+₹{bonusVal.toLocaleString('en-IN')} Bonus Added</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.divider} />

          {/* Metadata Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.metaLabel}>{t('date') || 'Date'}:</Text>
              <Text style={styles.metaValue}>{formatDateTime(item.paymentDate)}</Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="layers-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.metaLabel}>{t('installment') || 'Inst'}:</Text>
              <Text style={[styles.metaValue, { fontWeight: '700' }]}>#{item.installment}</Text>
            </View>
          </View>

          {/* Transaction / Order IDs with Copy Action */}
          {refCode ? (
            <View style={styles.refBox}>
              <View style={styles.refInfo}>
                <Text style={styles.refLabel}>
                  {item.gatewayTransactionId || item.utr_reference ? 'Txn Ref / UTR' : 'Order ID'}:
                </Text>
                <Text style={styles.refValue} numberOfLines={1}>
                  {refCode}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleCopy(String(refCode), 'Reference ID')}
                style={styles.copyBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="copy-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {item.isManual === 'yes' ? (
            <View style={styles.manualBadgeContainer}>
              <Ionicons name="business-outline" size={12} color="#B45309" />
              <Text style={styles.manualText}>Branch Office Manual Payment</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.quaternary || '#F2E6D2' }]} />
      <LinearGradient colors={['rgba(133,1,17,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.textDark}>
          {t('paymentHistory') || 'Payment History'}
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.textDark} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
          <Text style={styles.loaderText}>{t('loadingHistory') || 'Loading payment history...'}</Text>
        </View>
      ) : (
        <>
          {renderFilterChips()}
          <FlatList
            data={transactions}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={rf(50)} color="rgba(0,0,0,0.14)" />
                <Text style={styles.emptyText}>
                  {t('noPaymentHistory') || 'No payment transactions found.'}
                </Text>
              </View>
            }
            ListFooterComponent={renderFooter}
          />
        </>
      )}
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary || '#F2E6D2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.5),
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  guestText: {
    fontSize: rf(14),
    color: theme.colors.textSecondary,
    marginVertical: hp(2),
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: theme.colors.primary || '#850111',
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: rf(13),
    fontWeight: 'bold',
  },
  listContent: { paddingHorizontal: wp(4), paddingVertical: hp(1.5), paddingBottom: hp(8) },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: hp(1.5), color: theme.colors.textSecondary, fontSize: rf(12) },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderLeftWidth: 4.5,
    padding: wp(4),
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2.5 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(0.8),
  },
  schemeInfo: {
    flex: 1,
    marginRight: wp(2),
  },
  schemeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schemeNameText: {
    fontSize: rf(13),
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.3),
    gap: 6,
  },
  typeBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    paddingHorizontal: wp(1.8),
    paddingVertical: hp(0.2),
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: rf(8.5),
    fontWeight: '700',
    color: '#B45309',
  },
  accountNumberText: {
    fontSize: rf(9.5),
    fontWeight: '600',
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.4),
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: { fontSize: rf(9), fontWeight: '900', letterSpacing: 0.3 },
  cardBody: {
    marginTop: hp(0.3),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: hp(0.8),
    marginTop: hp(0.4),
  },
  amountLabel: {
    fontSize: rf(9.5),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountText: {
    fontSize: rf(19),
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  paymentMethodContainer: {
    alignItems: 'flex-end',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: wp(2.2),
    paddingVertical: hp(0.4),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentMethodText: {
    fontSize: rf(9.5),
    fontWeight: '700',
    color: '#475569',
  },
  rewardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: hp(0.5),
  },
  weightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  weightBadgeText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#92400E',
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  bonusBadgeText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#166534',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hp(0.8),
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(0.3),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: rf(10.5),
    color: '#64748B',
    marginRight: 4,
  },
  metaValue: {
    fontSize: rf(10.5),
    fontWeight: '600',
    color: '#1E293B',
  },
  refBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: 6,
    marginTop: hp(0.8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(2),
  },
  refLabel: {
    fontSize: rf(9.5),
    color: '#64748B',
    fontWeight: '600',
    marginRight: 4,
  },
  refValue: {
    fontSize: rf(9.5),
    fontWeight: '700',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    flex: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.3),
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 3,
  },
  copyBtnText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: theme.colors.primary || '#1D4ED8',
  },
  manualBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.6),
    backgroundColor: '#FEF3C7',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignSelf: 'flex-start',
  },
  manualText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#B45309',
    marginLeft: wp(1),
  },
  filterContainer: {
    paddingVertical: hp(1),
    marginBottom: hp(0.5),
  },
  filterScroll: {
    paddingHorizontal: wp(5),
    gap: wp(2.5),
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  activeFilterChip: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  filterChipText: {
    fontSize: rf(12),
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: theme.colors.textDark,
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(12) },
  emptyText: { fontSize: rf(13), color: theme.colors.textSecondary, marginTop: hp(2), textAlign: 'center' },
  footerLoader: {
    paddingVertical: hp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: 'transparent',
    paddingVertical: hp(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary || '#850111',
    borderRadius: 8,
    marginVertical: hp(2),
  },
  loadMoreButtonText: {
    color: theme.colors.textDark || '#850111',
    fontSize: rf(13),
    fontWeight: 'bold',
  },
}) }

var styles = getStyles(theme);;

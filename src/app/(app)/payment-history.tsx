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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import COLORS from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import { useTranslation } from '@/hooks/useTranslation';
import apiWithLoader from '@/services/apiWithLoader';
import { formatDateTime } from '@/utils/dateTimeUtils';

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
const QUATERNARY_COLOR = theme.colors.quaternary || '#F2E6D2';

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

// formatDateTime imported from dateTimeUtils

export default function PaymentHistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalStore();
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
          <ActivityIndicator size="small" color={theme.colors.primary} />
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
          label: t('success') || 'Success',
          color: '#2E7D32',
          backgroundColor: 'rgba(46,125,50,0.1)',
        };
      case 'failure':
      case 'failed':
      case 'fail':
      case 'authorization_failed':
      case 'authentication_failed':
        return {
          label: t('failed') || 'Failed',
          color: '#D32F2F',
          backgroundColor: 'rgba(211,47,47,0.1)',
        };
      case 'cancelled':
        return {
          label: t('cancelled') || 'Cancelled',
          color: '#757575',
          backgroundColor: 'rgba(117,117,117,0.1)',
        };
      case 'pending':
      default:
        return {
          label: t('pending') || 'Pending',
          color: '#E65100',
          backgroundColor: 'rgba(230,81,0,0.1)',
        };
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : ['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
        <LinearGradient colors={[theme.colors.quaternary, theme.colors.quaternary]} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
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

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.schemeInfo}>
            <Text style={styles.schemeNameText} numberOfLines={1}>
              {item.schemeName || `Scheme #${item.schemeId}`}
            </Text>
            {item.schemeType && (
              <Text style={styles.schemeTypeText}>
                {item.schemeType.toUpperCase()}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.backgroundColor, borderColor: statusMeta.color }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.amountRow}>
            <Text style={styles.amountText}>₹{amountVal.toLocaleString('en-IN')}</Text>
            <View style={styles.paymentMethodBadge}>
              <Text style={styles.paymentMethodText}>
                {item.paymentMethod || 'ONLINE'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>{t('dateAndTime') || 'Date & Time:'}</Text>
            <Text style={styles.value}>{formatDateTime(item.paymentDate)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>{t('installment') || 'Installment:'}</Text>
            <Text style={styles.value}>#{item.installment}</Text>
          </View>

          {item.orderId ? (
            <View style={styles.row}>
              <Text style={styles.label}>{t('orderId') || 'Order ID:'}</Text>
              <Text style={styles.valueCopyable} selectable>{item.orderId}</Text>
            </View>
          ) : null}

          {item.gatewayTransactionId || item.utr_reference ? (
            <View style={styles.row}>
              <Text style={styles.label}>{t('txnReference') || 'Txn Ref:'}</Text>
              <Text style={styles.valueCopyable} selectable>
                {item.gatewayTransactionId || item.utr_reference}
              </Text>
            </View>
          ) : null}

          {item.isManual === 'yes' ? (
            <View style={styles.manualBadgeContainer}>
              <Ionicons name="checkbox-outline" size={rf(12)} color="#D81B60" />
              <Text style={styles.manualText}>Office Manual Payment</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : ['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient colors={['rgba(133,1,17,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          {t('paymentHistory') || 'Payment History'}
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUATERNARY_COLOR,
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
    color: 'rgba(0,0,0,0.6)',
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
  listContent: { paddingHorizontal: wp(5), paddingVertical: hp(1.5), paddingBottom: hp(8) },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: hp(1.5), color: 'rgba(0,0,0,0.55)', fontSize: rf(12) },
  card: {
    backgroundColor: COLORS.white || '#ffffff',
    borderRadius: 14,
    padding: wp(4),
    marginBottom: hp(1.5),
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1),
  },
  schemeInfo: {
    flex: 1,
    marginRight: wp(2),
  },
  schemeNameText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: theme.colors.textDark || '#2e0406',
  },
  schemeTypeText: {
    fontSize: rf(9),
    fontWeight: '600',
    color: 'rgba(0,0,0,0.4)',
    marginTop: hp(0.2),
  },
  statusBadge: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: 7,
    borderWidth: 1,
  },
  statusText: { fontSize: rf(9), fontWeight: '900', textTransform: 'uppercase' },
  cardBody: {
    marginTop: hp(0.5),
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  amountText: {
    fontSize: rf(18),
    fontWeight: 'bold',
    color: theme.colors.primary || '#850111',
  },
  paymentMethodBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.4),
    borderRadius: 5,
  },
  paymentMethodText: {
    fontSize: rf(10),
    fontWeight: '700',
    color: 'rgba(0,0,0,0.55)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(0.35),
  },
  label: {
    fontSize: rf(11),
    color: 'rgba(0,0,0,0.45)',
  },
  value: {
    fontSize: rf(11),
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
  },
  valueCopyable: {
    fontSize: rf(11),
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: hp(1),
  },
  manualBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(1),
    backgroundColor: 'rgba(216,27,96,0.05)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  manualText: {
    fontSize: rf(9),
    fontWeight: '700',
    color: '#D81B60',
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
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeFilterChip: {
    backgroundColor: theme.colors.primary || '#850111',
    borderColor: theme.colors.primary || '#850111',
  },
  filterChipText: {
    fontSize: rf(12),
    color: 'rgba(0,0,0,0.6)',
    fontWeight: '600',
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(12) },
  emptyText: { fontSize: rf(13), color: 'rgba(0,0,0,0.35)', marginTop: hp(2), textAlign: 'center' },
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
    color: theme.colors.primary || '#850111',
    fontSize: rf(13),
    fontWeight: 'bold',
  },
});

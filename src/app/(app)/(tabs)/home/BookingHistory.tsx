import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import { advanceBookingAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logAppEvent } from '@/services/appEventService';
import { logger } from '@/utils/logger';

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || '#F2E6D2';

interface BookingItem {
  id: number;
  userId: number;
  goldWeight: number | string;
  ratePerGram: number | string;
  totalAmount: number | string;
  bookingAmount: number | string;
  remainingAmount: number | string;
  status: string;
  expiryDate: string;
  createdAt: string;
  convertedBillId?: number | string;
}

const formatCurrency = (value: number | string) => {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function BookingHistory() {
  const router = useRouter();
  const { user } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const userId = (user as any)?.userId || user?.id;

  const fetchBookings = useCallback(async (showLoader = true) => {
    if (!userId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);
      const response = await advanceBookingAPI.getBookingsByUser(userId);
      const list = response?.data?.data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (error: any) {
      logger.error('Error fetching bookings:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to fetch booking history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchBookings(true);
      logAppEvent('VIEW_BOOKING_HISTORY');
    }, [fetchBookings])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings(false);
  };

  const displayedBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((item) => {
      const isCompleted = item.status === 'COMPLETED';
      const isExpired = new Date(item.expiryDate) < now;
      const isClosed = isCompleted || isExpired;
      return activeTab === 'closed' ? isClosed : !isClosed;
    });
  }, [activeTab, bookings]);

  const renderBookingCard = ({ item }: { item: BookingItem }) => {
    const now = new Date();
    const expiry = new Date(item.expiryDate);
    const created = new Date(item.createdAt);

    // Days calculation
    const totalTime = expiry.getTime() - created.getTime();
    const remainingTime = expiry.getTime() - now.getTime();

    const totalDays = Math.max(1, Math.ceil(totalTime / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

    const progress = Math.max(0, Math.min(1, 1 - remainingDays / totalDays));
    const isCompleted = item.status === 'COMPLETED';
    const isExpired = remainingDays === 0;

    return (
      <View style={styles.bookingCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.iconWrapper}>
              <Ionicons name="diamond" size={rf(18)} color="#DAA520" />
            </View>
            <View>
              <Text style={styles.weightText}>{Number(item.goldWeight).toFixed(3)}g Gold</Text>
              <Text style={styles.rateText}>Locked @ {formatCurrency(item.ratePerGram)}/g</Text>
            </View>
          </View>

          {/* Status Badge */}
          {activeTab === 'closed' ? (
            <View
              style={[
                styles.statusBadge,
                isCompleted ? styles.completedBadge : styles.expiredBadge,
              ]}
            >
              <Text style={[styles.statusText, isCompleted ? styles.completedText : styles.expiredText]}>
                {isCompleted ? 'Purchased' : 'Expired'}
              </Text>
            </View>
          ) : (
            <View style={[styles.daysBadge, remainingDays <= 5 && styles.daysBadgeUrgent]}>
              <Ionicons name="time" size={rf(12)} color={remainingDays <= 5 ? COLORS.white : '#DAA520'} style={{ marginRight: wp(1) }} />
              <Text style={[styles.daysText, remainingDays <= 5 && styles.daysTextUrgent]}>
                {remainingDays} Days Left
              </Text>
            </View>
          )}
        </View>

        {/* Card Content Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Contract Value</Text>
            <Text style={styles.gridValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Advance Paid</Text>
            <Text style={styles.gridValue}>{formatCurrency(item.bookingAmount)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>Remaining Bal</Text>
            <Text style={[styles.gridValue, styles.remainingBalVal]}>{formatCurrency(item.remainingAmount)}</Text>
          </View>
        </View>

        {/* Expiry Progress Bar (Only for Active tab) */}
        {activeTab === 'active' && (
          <View style={styles.progressSection}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.dateLabel}>Booked: {formatDate(item.createdAt)}</Text>
              <Text style={styles.dateLabel}>Expiry: {formatDate(item.expiryDate)}</Text>
            </View>
          </View>
        )}

        {/* Closed/Completed Extra Details */}
        {activeTab === 'closed' && (
          <View style={styles.closedSection}>
            <View style={styles.closedDivider} />
            <View style={styles.closedRow}>
              <Text style={styles.dateLabel}>Booked on {formatDate(item.createdAt)}</Text>
              <Text style={styles.dateLabel}>Expired on {formatDate(item.expiryDate)}</Text>
            </View>
            {isCompleted && item.convertedBillId && (
              <Text style={styles.remarksText}>Converted to Bill ID: #{item.convertedBillId}</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient colors={['rgba(133,1,17,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          router.back();
          router.replace('/(app)/gold_advance');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          Advance Booking History
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sliding Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active Bookings</Text>
          {activeTab === 'active' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'closed' && styles.activeTab]} onPress={() => setActiveTab('closed')}>
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>Closed / Expired</Text>
          {activeTab === 'closed' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading bookings history...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedBookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={rf(50)} color="rgba(0,0,0,0.14)" />
              <Text style={styles.emptyText}>No bookings found in this section.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.5),
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: wp(5),
    borderRadius: 12,
    marginTop: hp(1),
    marginBottom: hp(2),
    overflow: 'hidden',
  },
  tab: { flex: 1, paddingVertical: hp(1.5), alignItems: 'center', position: 'relative' },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: rf(13), color: 'rgba(0,0,0,0.5)', fontWeight: '600' },
  activeTabText: { color: theme.colors.primary },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '30%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: { paddingHorizontal: wp(5), paddingBottom: hp(5) },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderText: { marginTop: hp(1.5), color: 'rgba(0,0,0,0.55)', fontSize: rf(12) },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: 'rgba(218,165,32,0.15)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.5),
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: wp(9),
    height: wp(9),
    borderRadius: wp(4.5),
    backgroundColor: 'rgba(218,165,32,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2.5),
  },
  weightText: {
    fontSize: rf(14),
    fontWeight: '800',
    color: theme.colors.textDark,
  },
  rateText: {
    fontSize: rf(10),
    color: 'rgba(0,0,0,0.5)',
    marginTop: 1,
  },
  daysBadge: {
    backgroundColor: 'rgba(218,165,32,0.12)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.6),
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  daysBadgeUrgent: {
    backgroundColor: '#D32F2F',
  },
  daysText: {
    color: '#DAA520',
    fontWeight: '800',
    fontSize: rf(11),
  },
  daysTextUrgent: {
    color: COLORS.white,
  },
  statusBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: 10,
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: 'rgba(46,125,50,0.3)',
  },
  expiredBadge: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderColor: 'rgba(0,0,0,0.2)',
  },
  statusText: {
    fontSize: rf(10),
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  completedText: { color: '#2E7D32' },
  expiredText: { color: '#666' },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: wp(3),
    marginBottom: hp(1.5),
  },
  gridItem: {
    flex: 1,
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: rf(9),
    color: 'rgba(0,0,0,0.45)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  gridValue: {
    fontSize: rf(12),
    fontWeight: '700',
    color: theme.colors.textDark,
    marginTop: hp(0.5),
  },
  remainingBalVal: {
    color: theme.colors.primary,
  },
  progressSection: {
    marginTop: hp(1),
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#DAA520',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.8),
  },
  dateLabel: {
    fontSize: rf(9),
    color: 'rgba(0,0,0,0.45)',
  },
  closedSection: {
    marginTop: hp(1),
  },
  closedDivider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginBottom: hp(1.2),
  },
  closedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  remarksText: {
    fontSize: rf(10),
    color: theme.colors.primary,
    fontWeight: '700',
    marginTop: hp(0.6),
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(15) },
  emptyText: { fontSize: rf(13), color: 'rgba(0,0,0,0.35)', marginTop: hp(2), textAlign: 'center' },
});

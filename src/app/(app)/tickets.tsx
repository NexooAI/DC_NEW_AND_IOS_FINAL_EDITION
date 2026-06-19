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
  UIManager,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import COLORS from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import FAQService from '@/services/faqService';
import useGlobalStore from '@/store/global.store';
import { useTranslation } from '@/hooks/useTranslation';

// Enable LayoutAnimation for Android (only if not on the New Architecture / Fabric)
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental &&
  !(global as any).RN$Fabric
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || '#F2E6D2';

interface TicketItem {
  id: number | string;
  ticket_number: string;
  user_id?: number | string | null;
  name: string;
  email?: string | null;
  phone: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved' | 'in_progress' | string;
  reference_type?: string | null;
  reference_id?: number | null;
  resolved_by?: number | null;
  resolved_at?: string | null;
  resolution_remarks?: string | null;
  created_at: string;
  updated_at?: string;
}

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

export default function TicketsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<'all' | 'resolved'>('all');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | number | null>(null);

  const userId = (user as any)?.userId || user?.id;

  const fetchTickets = useCallback(async (showLoader = true) => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);
      const response = await FAQService.getUserTickets(userId);
      const list = response?.data || [];
      setTickets(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets(true);
    }, [fetchTickets])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTickets(false);
  };

  const displayedTickets = useMemo(() => {
    if (activeTab === 'resolved') {
      return tickets.filter((ticket) => ticket.status === 'resolved');
    }
    return tickets;
  }, [activeTab, tickets]);

  const toggleExpand = (id: string | number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTicketId(expandedTicketId === id ? null : id);
  };

  const getStatusMeta = (status: string) => {
    switch (String(status).toLowerCase()) {
      case 'resolved':
        return {
          label: t('resolved') || 'Resolved',
          color: '#2E7D32',
          backgroundColor: 'rgba(46,125,50,0.1)',
        };
      case 'in_progress':
        return {
          label: t('inProgress') || 'In Progress',
          color: '#E65100',
          backgroundColor: 'rgba(230,81,0,0.1)',
        };
      case 'open':
      default:
        return {
          label: t('open') || 'Open',
          color: theme.colors.primary || '#850111',
          backgroundColor: 'rgba(133,1,17,0.1)',
        };
    }
  };

  if (!userId) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
        <LinearGradient colors={['rgba(133,1,17,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
            {t('ticketsAndEnquiries') || 'Tickets & Enquiries'}
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

  const renderTicketItem = ({ item }: { item: TicketItem }) => {
    const isExpanded = expandedTicketId === item.id;
    const statusMeta = getStatusMeta(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.subjectText} numberOfLines={1}>
            {item.subject}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.backgroundColor, borderColor: statusMeta.color }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('ticketNumber') || 'Ticket No:'}</Text>
            <Text style={styles.value}>{item.ticket_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('ticketCreated') || 'Created on:'}</Text>
            <Text style={styles.value}>{formatDate(item.created_at)}</Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedSection}>
            <View style={styles.divider} />
            <Text style={styles.expandedTitle}>{t('issueDescription') || 'Description'}</Text>
            <Text style={styles.descriptionText}>{item.message}</Text>

            {item.status === 'resolved' && item.resolution_remarks && (
              <View style={styles.resolutionBox}>
                <Text style={styles.resolutionTitle}>{t('resolutionRemarks') || 'Resolution Remarks'}</Text>
                <Text style={styles.resolutionText}>{item.resolution_remarks}</Text>
                {item.resolved_at && (
                  <Text style={styles.resolvedDateText}>
                    Resolved on: {formatDate(item.resolved_at)}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={rf(18)}
            color="rgba(0,0,0,0.4)"
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient colors={['rgba(133,1,17,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          {t('ticketsAndEnquiries') || 'Tickets & Enquiries'}
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab('all');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {t('allTickets') || 'All Tickets'}
          </Text>
          {activeTab === 'all' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resolved' && styles.activeTab]}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setActiveTab('resolved');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'resolved' && styles.activeTabText]}>
            {t('resolvedClosed') || 'Resolved / Closed'}
          </Text>
          {activeTab === 'resolved' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>{t('pleaseWait') || 'Loading tickets...'}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedTickets}
          renderItem={renderTicketItem}
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
              <Text style={styles.emptyText}>{t('noTickets') || 'No tickets found.'}</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/home/ticket-form')}
      >
        <Ionicons name="add" size={28} color="#000000" />
      </TouchableOpacity>
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
    paddingVertical: hp(1.5),
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
    backgroundColor: COLORS.white || '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: rf(13), color: 'rgba(0,0,0,0.5)', fontWeight: '600' },
  activeTabText: { color: theme.colors.primary || '#850111' },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '30%',
    height: 3,
    backgroundColor: theme.colors.primary || '#850111',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  listContent: { paddingHorizontal: wp(5), paddingBottom: hp(12) },
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
    alignItems: 'center',
    marginBottom: hp(1),
  },
  subjectText: {
    fontSize: rf(14),
    fontWeight: '700',
    color: theme.colors.textDark || '#2e0406',
    flex: 1,
    marginRight: wp(2),
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: hp(0.3),
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
  expandedSection: {
    marginTop: hp(1.5),
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: hp(1.5),
  },
  expandedTitle: {
    fontSize: rf(12),
    fontWeight: '700',
    color: theme.colors.textDark || '#2e0406',
    marginBottom: hp(0.5),
  },
  descriptionText: {
    fontSize: rf(12),
    color: 'rgba(0,0,0,0.65)',
    lineHeight: rf(16),
  },
  resolutionBox: {
    marginTop: hp(1.5),
    padding: wp(3),
    backgroundColor: 'rgba(46,125,50,0.05)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2E7D32',
  },
  resolutionTitle: {
    fontSize: rf(11),
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: hp(0.3),
  },
  resolutionText: {
    fontSize: rf(11),
    color: 'rgba(0,0,0,0.7)',
    lineHeight: rf(15),
  },
  resolvedDateText: {
    fontSize: rf(9),
    color: 'rgba(0,0,0,0.4)',
    marginTop: hp(0.5),
  },
  cardFooter: {
    alignItems: 'center',
    marginTop: hp(0.8),
  },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(10) },
  emptyText: { fontSize: rf(13), color: 'rgba(0,0,0,0.35)', marginTop: hp(2), textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: hp(3),
    right: wp(5),
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    backgroundColor: theme.colors.secondary || '#ffc90c',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 6 },
    }),
  },
});

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
  Modal,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import { advanceBookingAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logAppEvent } from '@/services/appEventService';
import { logger } from '@/utils/logger';
import { saveFileToPublicDirectory } from '@/utils/fileUtils';
import * as FileSystem from 'expo-file-system/legacy';
import { formatDate, convertUTCToLocal } from '@/utils/dateTimeUtils';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as WebBrowser from 'expo-web-browser';
import { generateBookingReceiptHTML, BookingReceiptData } from '@/templates/html';

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

// formatDate imported from dateTimeUtils

export default function BookingHistory() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<'active' | 'closed'>('active');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const userId = (user as any)?.userId || user?.id;

  const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');

  const handleShareBookingReceipt = async (booking: BookingItem) => {
    const receiptData: BookingReceiptData = {
      bookingId: booking.id,
      goldWeight: booking.goldWeight,
      ratePerGram: booking.ratePerGram,
      totalAmount: booking.totalAmount,
      bookingAmount: booking.bookingAmount,
      remainingAmount: booking.remainingAmount,
      status: booking.status,
      expiryDate: booking.expiryDate,
      createdAt: booking.createdAt,
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      convertedBillId: booking.convertedBillId,
    };

    try {
      const htmlContent = generateBookingReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || 'Customer');
      const accountNo = sanitizeFileName(user?.id?.toString() || '000000');
      const fileName = `Booking_${customerName}_${accountNo}_${booking.id}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share booking receipt',
        });
      } else {
        if (Platform.OS === 'ios') {
          await WebBrowser.openBrowserAsync(targetUri);
        } else {
          Alert.alert(
            'Saved',
            `Receipt saved successfully!\n\nLocation:\n${targetUri}\n\nYou can access it from your device's Files/Documents folder: On My Device -> ${fileName}`
          );
        }
      }
    } catch (e) {
      console.error('Booking receipt generation failed', e);
      Alert.alert('Error', 'Failed to generate booking receipt');
    }
  };

  const handleDownloadBookingReceipt = async (booking: BookingItem) => {
    const receiptData: BookingReceiptData = {
      bookingId: booking.id,
      goldWeight: booking.goldWeight,
      ratePerGram: booking.ratePerGram,
      totalAmount: booking.totalAmount,
      bookingAmount: booking.bookingAmount,
      remainingAmount: booking.remainingAmount,
      status: booking.status,
      expiryDate: booking.expiryDate,
      createdAt: booking.createdAt,
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
      convertedBillId: booking.convertedBillId,
    };

    try {
      const htmlContent = generateBookingReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || 'Customer');
      const accountNo = sanitizeFileName(user?.id?.toString() || '000000');
      const fileName = `Booking_${customerName}_${accountNo}_${booking.id}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      await saveFileToPublicDirectory(targetUri, fileName, "Booking receipt saved to your chosen folder successfully!");
    } catch (e) {
      console.error('Booking receipt download failed', e);
      Alert.alert('Error', 'Failed to download booking receipt');
    }
  };

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

  const getRepaymentTranslation = () => {
    const lang = useGlobalStore.getState().language || "en";
    const dict: Record<string, string> = {
      ta: "மீதித் தொகை செலுத்தவும்",
      en: "PAY REMAINING BALANCE",
      te: "మిగిలిన బ్యాలెన్స్ చెల్లించండి",
      hi: "शेष राशि का भुगतान करें",
      mal: "ബാക്കി തുക അടയ്ക്കുക"
    };
    return dict[lang] || dict["en"];
  };

  const handlePayBalance = (booking: any) => {
    setDetailModalVisible(false);
    
    const { user } = useGlobalStore.getState();
    const userIdVal = user?.id || (user as any)?.userId;

    router.push({
      pathname: '/(app)/(tabs)/home/paymentNewOverView',
      params: {
        paymentType: 'advance_booking_repayment',
        bookingId: String(booking.id),
        amount: String(booking.remainingAmount),
        userDetails: JSON.stringify({
          userId: String(userIdVal),
          name: user?.name || '',
          mobile: user?.mobile || '',
          email: user?.email || '',
          accountNo: booking.accountNumber || '',
        }),
      },
    });
  };

  const displayedBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((item) => {
      const isCompleted = item.status === 'COMPLETED';
      const isExpired = convertUTCToLocal(item.expiryDate) < now;
      const isClosed = isCompleted || isExpired;
      return activeTab === 'closed' ? isClosed : !isClosed;
    });
  }, [activeTab, bookings]);

  const renderBookingCard = ({ item }: { item: BookingItem }) => {
    const now = new Date();
    const expiry = convertUTCToLocal(item.expiryDate);
    const created = convertUTCToLocal(item.createdAt);

    // Days calculation
    const totalTime = expiry.getTime() - created.getTime();
    const remainingTime = expiry.getTime() - now.getTime();

    const totalDays = Math.max(1, Math.ceil(totalTime / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil(remainingTime / (1000 * 60 * 60 * 24)));

    const progress = Math.max(0, Math.min(1, 1 - remainingDays / totalDays));
    const isCompleted = item.status === 'COMPLETED';
    const isExpired = remainingDays === 0;

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedBooking(item);
          setDetailModalVisible(true);
        }}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleGroup}>
            <View style={styles.iconWrapper}>
              <Ionicons name="diamond" size={rf(18)} color="#DAA520" />
            </View>
            <View>
              <Text style={styles.weightText}>{Number(item.goldWeight).toFixed(3)}{t("goldSymbol")} {t("gold")}</Text>
              <Text style={styles.rateText}>{t("lockedRateLabel")} {formatCurrency(item.ratePerGram)}/{t("goldSymbol")}</Text>
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
                {isCompleted ? t("purchased") : t("expired")}
              </Text>
            </View>
          ) : (
            <View style={[styles.daysBadge, remainingDays <= 5 && styles.daysBadgeUrgent]}>
              <Ionicons name="time" size={rf(12)} color={remainingDays <= 5 ? COLORS.white : '#DAA520'} style={{ marginRight: wp(1) }} />
              <Text style={[styles.daysText, remainingDays <= 5 && styles.daysTextUrgent]}>
                {remainingDays} {t("daysLeft")}
              </Text>
            </View>
          )}
        </View>

        {/* Card Content Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>{t("contractValue")}</Text>
            <Text style={styles.gridValue}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>{t("advancePaid")}</Text>
            <Text style={styles.gridValue}>{formatCurrency(item.bookingAmount)}</Text>
          </View>
          <View style={styles.gridItem}>
            <Text style={styles.gridLabel}>{t("remainingBal")}</Text>
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
              <Text style={styles.dateLabel}>{t("bookedLabel")}: {formatDate(item.createdAt)}</Text>
              <Text style={styles.dateLabel}>{t("expiryLabel")}: {formatDate(item.expiryDate)}</Text>
            </View>
          </View>
        )}

        {/* Closed/Completed Extra Details */}
        {activeTab === 'closed' && (
          <View style={styles.closedSection}>
            <View style={styles.closedDivider} />
            <View style={styles.closedRow}>
              <Text style={styles.dateLabel}>{t("bookedOn")} {formatDate(item.createdAt)}</Text>
              <Text style={styles.dateLabel}>{t("expiredOn")} {formatDate(item.expiryDate)}</Text>
            </View>
            {isCompleted && !!item.convertedBillId && (
              <Text style={styles.remarksText}>{t("convertedToBillId")}: #{item.convertedBillId}</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient colors={[theme.colors.quaternary, theme.colors.quaternary]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, Platform.OS === 'android' && { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => {
          router.back();
          router.replace('/(app)/gold_advance');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          {t("advanceBookingHistory")}
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sliding Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'active' && styles.activeTab]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>{t("activeBookings")}</Text>
          {activeTab === 'active' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'closed' && styles.activeTab]} onPress={() => setActiveTab('closed')}>
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>{t("closedExpired")}</Text>
          {activeTab === 'closed' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>{t("loadingBookingsHistory")}</Text>
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
              <Text style={styles.emptyText}>{t("noBookingsFound")}</Text>
            </View>
          }
        />
      )}

      {/* Booking details modal popup */}
      <Modal animationType="slide" transparent visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
          <View style={styles.detailModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("bookingDetails")}</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("bookingId")}</Text>
                      <Text style={styles.detailValue}>#{selectedBooking.id}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("goldWeight")}</Text>
                      <Text style={styles.detailValue}>{Number(selectedBooking.goldWeight).toFixed(3)}{t("goldSymbol")}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("lockedRate")}</Text>
                      <Text style={styles.detailValue}>{formatCurrency(selectedBooking.ratePerGram)}/{t("goldSymbol")}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("statusLabel")}</Text>
                      <View style={[styles.statusBadge, selectedBooking.status === 'COMPLETED' ? styles.completedBadge : styles.expiredBadge]}>
                        <Text style={[styles.statusText, selectedBooking.status === 'COMPLETED' ? styles.completedText : styles.expiredText]}>
                          {selectedBooking.status === 'COMPLETED' ? t("purchased") : selectedBooking.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailDivider} />

                    <View style={styles.amountLine}>
                      <Text style={styles.amountLabel}>{t("totalAmount")}</Text>
                      <Text style={styles.amountValue}>{formatCurrency(selectedBooking.totalAmount)}</Text>
                    </View>
                    <View style={styles.amountLine}>
                      <Text style={styles.amountLabel}>{t("advancePaid")}</Text>
                      <Text style={styles.amountValue}>{formatCurrency(selectedBooking.bookingAmount)}</Text>
                    </View>
                    <View style={styles.amountLine}>
                      <Text style={styles.amountLabel}>{t("remainingBalance")}</Text>
                      <Text style={[styles.amountValue, styles.remainingBalVal]}>{formatCurrency(selectedBooking.remainingAmount)}</Text>
                    </View>

                    <View style={styles.detailDivider} />

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("bookingDate")}</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedBooking.createdAt)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{t("expiryDate")}</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedBooking.expiryDate)}</Text>
                    </View>
                    {!!selectedBooking.convertedBillId && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>{t("convertedToBillId")}</Text>
                        <Text style={styles.detailValue}>#{selectedBooking.convertedBillId}</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.downloadBtn]}
                    onPress={() => handleDownloadBookingReceipt(selectedBooking)}
                  >
                    <Ionicons name="download-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.downloadBtnText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.shareBtn]}
                    onPress={() => handleShareBookingReceipt(selectedBooking)}
                  >
                    <Ionicons name="share-social-outline" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.shareBtnText}>Share</Text>
                  </TouchableOpacity>
                </View>

                {(selectedBooking.status === 'ACTIVE' || selectedBooking.status === 'PARTIAL') && Number(selectedBooking.remainingAmount) > 0 && (
                  <TouchableOpacity
                    style={styles.payBalanceButton}
                    onPress={() => handlePayBalance(selectedBooking)}
                  >
                    <Ionicons name="card-outline" size={18} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.payBalanceText}>{getRepaymentTranslation()}</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: wp(6),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    maxHeight: '86%',
    elevation: 20,
  },
  modalHandle: {
    width: wp(12),
    height: 5,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: hp(2),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2) },
  modalTitle: { fontSize: rf(21), fontWeight: '800', color: theme.colors.primary },
  closeButton: { padding: 2 },
  detailScroll: { paddingBottom: hp(4) },
  detailCard: {
    backgroundColor: '#FBFBFB',
    borderRadius: 14,
    padding: wp(5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(2), gap: wp(3) },
  detailLabel: { fontSize: rf(13), color: '#757575', fontWeight: '500' },
  detailValue: { flex: 1, fontSize: rf(14), fontWeight: '700', color: '#212121', textAlign: 'right' },
  detailDivider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: hp(1) },
  amountLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: hp(0.9) },
  amountLabel: { fontSize: rf(14), color: '#555', fontWeight: '600' },
  amountValue: { fontSize: rf(16), color: '#222', fontWeight: '800' },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hp(2),
    gap: wp(3),
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    height: hp(5.5),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  downloadBtn: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  downloadBtnText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: rf(12),
  },
  shareBtn: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  shareBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: rf(12),
  },
  payBalanceButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    height: hp(5.5),
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: hp(1.5),
  },
  payBalanceText: {
    color: 'white',
    fontWeight: '800',
    fontSize: rf(12.5),
    letterSpacing: 0.5,
  },
});

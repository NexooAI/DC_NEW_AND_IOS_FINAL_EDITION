import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as WebBrowser from 'expo-web-browser';
import { generateBillReceiptHTML, BillReceiptData } from '@/templates/html';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import apiClient, { billsAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logAppEvent } from '@/services/appEventService';
import { saveFileToPublicDirectory } from '@/utils/fileUtils';

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || '#F2E6D2';

type BillStatus = 'PARTIAL' | 'PAID' | 'EXPIRED' | string;

interface BillApiItem {
  id?: number | string;
  billId?: number | string;
  bill_id?: number | string;
  bill_number?: string;
  description?: string;
  bill_date?: string;
  totalAmount?: number | string;
  paidAmount?: number | string;
  pendingAmount?: number | string;
  status?: BillStatus;
}

interface BillItem {
  id: string;
  billNumber: string;
  description: string;
  billDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: BillStatus;
  raw: BillApiItem;
}

const toAmount = (value: unknown) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

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

const getBillId = (bill: BillApiItem) => bill.id ?? bill.billId ?? bill.bill_id;

const normalizeBill = (bill: BillApiItem): BillItem => {
  const id = getBillId(bill);
  return {
    id: String(id ?? bill.bill_number ?? Math.random()),
    billNumber: bill.bill_number || 'N/A',
    description: bill.description || 'Bill Payment',
    billDate: formatDate(bill.bill_date),
    totalAmount: toAmount(bill.totalAmount),
    paidAmount: toAmount(bill.paidAmount),
    pendingAmount: toAmount(bill.pendingAmount),
    status: String(bill.status || '').toUpperCase(),
    raw: bill,
  };
};

const canPayBill = (bill: BillItem) => bill.status === 'PARTIAL' && bill.pendingAmount > 0;

const getStatusMeta = (status: BillStatus) => {
  switch (String(status).toUpperCase()) {
    case 'PAID':
      return {
        label: 'Paid',
        icon: 'checkmark-done-circle-outline' as const,
        color: '#2E7D32',
        backgroundColor: 'rgba(46,125,50,0.1)',
      };
    case 'EXPIRED':
      return {
        label: 'Expired',
        icon: 'time-outline' as const,
        color: '#9E5A00',
        backgroundColor: 'rgba(158,90,0,0.12)',
      };
    case 'PARTIAL':
      return {
        label: 'Partial',
        icon: 'receipt-outline' as const,
        color: theme.colors.primary,
        backgroundColor: 'rgba(133,1,17,0.1)',
      };
    default:
      return {
        label: String(status || 'Pending'),
        icon: 'receipt-outline' as const,
        color: '#555',
        backgroundColor: 'rgba(0,0,0,0.08)',
      };
  }
};

const extractPaymentUrl = (paymentSession: any) => {
  if (!paymentSession) return '';
  if (typeof paymentSession === 'string') return paymentSession;
  return (
    paymentSession?.payment_links?.web ||
    paymentSession?.paymentLinks?.web ||
    paymentSession?.links?.web ||
    paymentSession?.web ||
    paymentSession?.url ||
    paymentSession?.paymentUrl ||
    paymentSession?.payment_url ||
    ''
  );
};

const getApiErrorMessage = (error: any) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    'Unable to process bill payment. Please try again.';

  const normalized = String(message).toLowerCase();
  if (normalized.includes('not found')) return 'Bill not found';
  if (normalized.includes('already paid')) return 'Bill already paid';
  if (normalized.includes('pending amount')) return 'No pending amount to pay';
  if (normalized.includes('required')) return 'Bill ID and User ID are required';
  return String(message);
};

export default function BillPayment() {
  const router = useRouter();
  const { user } = useGlobalStore();
  const [activeTab, setActiveTab] = useState<'all' | 'closed'>('all');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');

  const userId = (user as any)?.userId || user?.id;

  const sanitizeFileName = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '_');

  const handleShareBillReceipt = async (bill: BillItem) => {
    const receiptData: BillReceiptData = {
      billId: bill.id,
      billNumber: bill.billNumber,
      description: bill.description,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      pendingAmount: bill.pendingAmount,
      status: bill.status,
      billDate: bill.billDate,
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
    };

    try {
      const htmlContent = generateBillReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || 'Customer');
      const accountNo = sanitizeFileName(user?.id?.toString() || '000000');
      const fileName = `Bill_${customerName}_${accountNo}_${bill.billNumber}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(targetUri, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Share bill receipt',
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
      console.error('Bill receipt generation failed', e);
      Alert.alert('Error', 'Failed to generate bill receipt');
    }
  };

  const handleDownloadBillReceipt = async (bill: BillItem) => {
    const receiptData: BillReceiptData = {
      billId: bill.id,
      billNumber: bill.billNumber,
      description: bill.description,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      pendingAmount: bill.pendingAmount,
      status: bill.status,
      billDate: bill.billDate,
      userName: user?.name,
      userMobile: user?.mobile?.toString(),
      userEmail: user?.email,
    };

    try {
      const htmlContent = generateBillReceiptHTML(receiptData);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      const customerName = sanitizeFileName(user?.name || 'Customer');
      const accountNo = sanitizeFileName(user?.id?.toString() || '000000');
      const fileName = `Bill_${customerName}_${accountNo}_${bill.billNumber}.pdf`;

      const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
      const targetUri = `${targetDir}${fileName}`;
      await FileSystem.moveAsync({ from: uri, to: targetUri });

      await saveFileToPublicDirectory(targetUri, fileName, 'Bill receipt saved to your chosen folder successfully!');
    } catch (e) {
      console.error('Bill receipt download failed', e);
      Alert.alert('Error', 'Failed to download bill receipt');
    }
  };

  const fetchBills = useCallback(async (showLoader = true) => {
    if (!userId) {
      setBills([]);
      setLoading(false);
      Alert.alert('Bill Payment', 'Bill ID and User ID are required');
      return;
    }

    try {
      if (showLoader) setLoading(true);
      const response = await billsAPI.getUserBills(userId);
      const list = response?.data?.data || [];
      setBills(Array.isArray(list) ? list.map(normalizeBill) : []);
    } catch (error) {
      Alert.alert('Error', getApiErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchBills(true);
      logAppEvent('VIEW_BILLS');
    }, [fetchBills])
  );

  const displayedBills = useMemo(() => {
    if (activeTab === 'closed') {
      return bills.filter((bill) => bill.status === 'PAID' || bill.status === 'EXPIRED');
    }
    return bills;
  }, [activeTab, bills]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBills(false);
  };

  const validatePayable = (bill: BillItem) => {
    const billId = getBillId(bill.raw);
    if (!billId || !userId) {
      Alert.alert('Bill Payment', 'Bill ID and User ID are required');
      return null;
    }
    if (bill.status === 'PAID') {
      Alert.alert('Bill Payment', 'Bill already paid');
      return null;
    }
    if (bill.pendingAmount <= 0) {
      Alert.alert('Bill Payment', 'No pending amount to pay');
      return null;
    }
    if (bill.status !== 'PARTIAL') {
      Alert.alert('Bill Payment', bill.status === 'EXPIRED' ? 'This bill has expired' : 'Payment is not available for this bill');
      return null;
    }
    return billId;
  };

  const handlePay = async (bill: BillItem) => {
    const billId = validatePayable(bill);
    if (!billId) return;

    logAppEvent('BILL_PAYMENT_INITIATED', {
      billId: String(billId),
      billNumber: bill.billNumber,
      amount: bill.pendingAmount,
    });

    console.log("[DEBUG Payment Flow] handlePay called for bill:", bill.id);
    console.log("[DEBUG Payment Flow] User ID:", userId);

    try {
      setSelectedBill(bill);
      setProcessingMessage('Checking KYC status...');
      setPayingBillId(bill.id);

      // Verify KYC status before proceeding to pay
      const kycResponse = await apiClient.get(`/kyc/status/${userId}`);
      const isKycCompleted = kycResponse.data && (kycResponse.data.kyc_status === "Completed" || kycResponse.data.data);
      if (!isKycCompleted) {
        setPayingBillId(null);
        setProcessingMessage('');
        Alert.alert(
          'KYC Required',
          'Please complete your KYC details to continue with this payment.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Complete KYC',
              onPress: () => {
                router.push('/home/kyc');
              }
            }
          ]
        );
        return;
      }

      setDetailModalVisible(false);

      console.log("[DEBUG Payment Flow] Routing to paymentNewOverView with params for bill:", billId);

      router.push({
        pathname: '/(tabs)/home/paymentNewOverView',
        params: {
          paymentType: 'bill',
          billId: String(billId),
          billNumber: bill.billNumber,
          description: bill.description,
          amount: String(bill.pendingAmount),
          userDetails: JSON.stringify({
            userId: String(userId),
            name: user?.name || '',
            mobile: user?.mobile?.toString() || '',
            email: user?.email || '',
            accountNo: String((user as any)?.accountNumber || (user as any)?.accountNo || (user as any)?.accNo || ''),
          }),
        },
      });
    } catch (error) {
      console.error("[DEBUG Payment Flow] Error in handlePay:", error);
      Alert.alert('Payment Failed', getApiErrorMessage(error));
    } finally {
      setPayingBillId(null);
      setProcessingMessage('');
      fetchBills(false);
    }
  };

  const handleCardPress = (bill: BillItem) => {
    setSelectedBill(bill);
    setDetailModalVisible(true);
  };

  const renderAmountLine = (label: string, value: number, accent = false) => (
    <View style={styles.amountLine}>
      <Text style={styles.amountLabel}>{label}</Text>
      <Text style={[styles.amountValue, accent && styles.pendingAmount]}>{formatCurrency(value)}</Text>
    </View>
  );

  const renderBillItem = ({ item }: { item: BillItem }) => {
    const statusMeta = getStatusMeta(item.status);
    const isPaying = payingBillId === item.id;

    return (
      <TouchableOpacity style={styles.billCard} activeOpacity={0.78} onPress={() => handleCardPress(item)}>
        <View style={[styles.iconCircle, { backgroundColor: statusMeta.backgroundColor }]}>
          <Ionicons name={statusMeta.icon} size={rf(19)} color={statusMeta.color} />
        </View>

        <View style={styles.billInfo}>
          <Text style={styles.billType} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.billId}>{item.billNumber}</Text>
          <Text style={styles.billDate}>{item.billDate}</Text>

          <View style={styles.inlineAmounts}>
            <Text style={styles.inlineAmountText}>Paid {formatCurrency(item.paidAmount)}</Text>
            <Text style={styles.inlineDot}>•</Text>
            <Text style={styles.inlineAmountText}>Pending {formatCurrency(item.pendingAmount)}</Text>
          </View>
        </View>

        <View style={styles.billAction}>
          <Text style={[styles.billAmount, { color: canPayBill(item) ? theme.colors.primary : statusMeta.color }]}>
            {formatCurrency(item.pendingAmount)}
          </Text>
          {canPayBill(item) ? (
            <TouchableOpacity
              style={[styles.paySmallButton, isPaying && styles.disabledButton]}
              disabled={isPaying}
              onPress={(event) => {
                event.stopPropagation();
                handlePay(item);
              }}
            >
              {isPaying ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.paySmallButtonText}>Pay Now</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.backgroundColor, borderColor: statusMeta.color }]}>
              <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

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
          My Bills
        </ResponsiveText>
        <TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
          <Ionicons name="refresh" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'all' && styles.activeTab]} onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All Bills</Text>
          {activeTab === 'all' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'closed' && styles.activeTab]} onPress={() => setActiveTab('closed')}>
          <Text style={[styles.tabText, activeTab === 'closed' && styles.activeTabText]}>Paid / Expired</Text>
          {activeTab === 'closed' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loaderText}>Loading bills...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedBills}
          renderItem={renderBillItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={rf(50)} color="rgba(0,0,0,0.14)" />
              <Text style={styles.emptyText}>No bills found.</Text>
            </View>
          }
        />
      )}

      <Modal animationType="slide" transparent visible={detailModalVisible} onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setDetailModalVisible(false)} />
          <View style={styles.detailModalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bill Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedBill && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailScroll}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bill Number</Text>
                    <Text style={styles.detailValue}>{selectedBill.billNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.detailValue}>{selectedBill.description}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bill Date</Text>
                    <Text style={styles.detailValue}>{selectedBill.billDate}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusMeta(selectedBill.status).backgroundColor, borderColor: getStatusMeta(selectedBill.status).color }]}>
                      <Text style={[styles.statusText, { color: getStatusMeta(selectedBill.status).color }]}>
                        {getStatusMeta(selectedBill.status).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailDivider} />
                  {renderAmountLine('Total Amount', selectedBill.totalAmount)}
                  {renderAmountLine('Paid Amount', selectedBill.paidAmount)}
                  {renderAmountLine('Pending Amount', selectedBill.pendingAmount, true)}
                </View>

                {canPayBill(selectedBill) ? (
                  <TouchableOpacity
                    style={[styles.modalPayButton, payingBillId === selectedBill.id && styles.disabledButton]}
                    disabled={payingBillId === selectedBill.id}
                    onPress={() => handlePay(selectedBill)}
                  >
                    <LinearGradient colors={[theme.colors.primary, '#b50d29']} style={styles.modalPayGradient}>
                      {payingBillId === selectedBill.id ? (
                        <ActivityIndicator size="small" color={COLORS.white} />
                      ) : (
                        <Text style={styles.modalPayText}>PAY NOW</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.unavailableBox}>
                    <Text style={styles.unavailableText}>
                      {selectedBill.status === 'PAID'
                        ? 'This bill is already paid.'
                        : selectedBill.status === 'EXPIRED'
                          ? 'This bill has expired.'
                          : 'No pending amount to pay.'}
                    </Text>
                  </View>
                )}

                {selectedBill.paidAmount > 0 && (
                  <View style={styles.modalActionRow}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.downloadBtn]}
                      onPress={() => handleDownloadBillReceipt(selectedBill)}
                    >
                      <Ionicons name="download-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.downloadBtnText}>Download</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.shareBtn]}
                      onPress={() => handleShareBillReceipt(selectedBill)}
                    >
                      <Ionicons name="share-social-outline" size={18} color="white" style={{ marginRight: 6 }} />
                      <Text style={styles.shareBtnText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={!!payingBillId} animationType="fade" transparent>
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.processingTitle}>Payment Processing</Text>
            <Text style={styles.processingMessage}>{processingMessage || 'Please wait...'}</Text>
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
    paddingVertical: hp(1.5),
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
  billCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: wp(4),
    marginBottom: hp(1.5),
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  iconCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(3),
  },
  billInfo: { flex: 1, paddingRight: wp(2) },
  billType: { fontSize: rf(14), fontWeight: '700', color: theme.colors.textDark },
  billId: { fontSize: rf(12), color: 'rgba(0,0,0,0.6)', marginTop: 2 },
  billDate: { fontSize: rf(10), color: 'rgba(0,0,0,0.45)', marginTop: 2 },
  inlineAmounts: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: hp(0.6) },
  inlineAmountText: { fontSize: rf(10), color: 'rgba(0,0,0,0.55)' },
  inlineDot: { fontSize: rf(10), color: 'rgba(0,0,0,0.35)', marginHorizontal: wp(1) },
  billAction: { alignItems: 'flex-end', minWidth: wp(22) },
  billAmount: { fontSize: rf(15), fontWeight: '800', marginBottom: hp(1) },
  paySmallButton: {
    minWidth: wp(18),
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: 8,
    alignItems: 'center',
  },
  paySmallButtonText: { color: COLORS.white, fontSize: rf(10), fontWeight: 'bold' },
  disabledButton: { opacity: 0.65 },
  statusBadge: {
    paddingHorizontal: wp(2.6),
    paddingVertical: hp(0.45),
    borderRadius: 7,
    borderWidth: 1,
  },
  statusText: { fontSize: rf(9), fontWeight: '900', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: hp(10) },
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
  pendingAmount: { color: theme.colors.primary, fontSize: rf(18) },
  modalPayButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: hp(1),
    ...Platform.select({
      ios: { shadowColor: theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
      android: { elevation: 5 },
    }),
  },
  modalPayGradient: { minHeight: hp(6.5), paddingVertical: hp(2), alignItems: 'center', justifyContent: 'center' },
  modalPayText: { color: COLORS.white, fontSize: rf(15), fontWeight: '800', letterSpacing: 1 },
  unavailableBox: {
    borderRadius: 12,
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  unavailableText: { fontSize: rf(12), color: 'rgba(0,0,0,0.62)', fontWeight: '600', textAlign: 'center' },
  processingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(8),
  },
  processingCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: wp(6),
    alignItems: 'center',
  },
  processingTitle: { marginTop: hp(2), fontSize: rf(17), fontWeight: '800', color: theme.colors.textDark },
  processingMessage: { marginTop: hp(0.8), fontSize: rf(12), color: 'rgba(0,0,0,0.55)', textAlign: 'center' },
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
});

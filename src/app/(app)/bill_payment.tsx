import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || "#F2E6D2";

// Mock Data Types
interface BillItem {
  id: string;
  type: string;
  billNumber: string;
  amount: number;
  date: string;
  status: 'pending' | 'paid';
}

const PENDING_BILLS: BillItem[] = [
  { id: '1', type: 'Jewelry Purchase', billNumber: 'INV-2024-089', amount: 15400, date: '20 Oct 2024', status: 'pending' },
  { id: '2', type: 'Custom Order', billNumber: 'INV-2024-102', amount: 45000, date: '15 Oct 2024', status: 'pending' },
];

const COMPLETED_BILLS: BillItem[] = [
  { id: '3', type: 'Gold Scheme Pay', billNumber: 'SCH-9921', amount: 5000, date: '01 Oct 2024', status: 'paid' },
  { id: '4', type: 'Repair Charges', billNumber: 'REP-0012', amount: 1200, date: '25 Sep 2024', status: 'paid' },
  { id: '5', type: 'Old Gold Exchange', billNumber: 'EXC-4410', amount: 22000, date: '10 Sep 2024', status: 'paid' },
];

export default function BillPayment() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillItem | null>(null);

  const handlePay = (bill: BillItem) => {
    setSelectedBill(bill);
    setMaintenanceModalVisible(true);
  };

  const handleCardPress = (bill: BillItem) => {
    setSelectedBill(bill);
    setDetailModalVisible(true);
  };

  const renderBillItem = ({ item }: { item: BillItem }) => (
    <TouchableOpacity 
      style={styles.billCard} 
      activeOpacity={0.7}
      onPress={() => handleCardPress(item)}
    >
      <View style={styles.billIconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: item.status === 'pending' ? 'rgba(133,1,17,0.1)' : 'rgba(56,142,60,0.1)' }]}>
          <Ionicons 
            name={item.status === 'pending' ? "receipt-outline" : "checkmark-done-circle-outline"} 
            size={rf(18)} 
            color={item.status === 'pending' ? theme.colors.primary : "#388E3C"} 
          />
        </View>
      </View>
      
      <View style={styles.billInfo}>
        <Text style={styles.billType}>{item.type}</Text>
        <Text style={styles.billId}>{item.billNumber}</Text>
        <Text style={styles.billDate}>{item.date}</Text>
      </View>

      <View style={styles.billAction}>
        <Text style={[styles.billAmount, { color: item.status === 'pending' ? theme.colors.primary : "#388E3C" }]}>
          ₹{item.amount.toLocaleString('en-IN')}
        </Text>
        {item.status === 'pending' ? (
          <TouchableOpacity 
            style={styles.paySmallButton} 
            onPress={(e) => {
              e.stopPropagation();
              handlePay(item);
            }}
          >
            <Text style={styles.paySmallButtonText}>Pay Now</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBadge}>
            <Text style={styles.paidBadgeText}>PAID</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient colors={["rgba(133,1,17,0.05)", "transparent"]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          Bill Payment
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]} 
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>New Bills</Text>
          {activeTab === 'pending' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>Completed</Text>
          {activeTab === 'history' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'pending' ? PENDING_BILLS : COMPLETED_BILLS}
        renderItem={renderBillItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name={activeTab === 'pending' ? "happy-outline" : "receipt-outline"} size={rf(50)} color="rgba(0,0,0,0.1)" />
            <Text style={styles.emptyText}>
              {activeTab === 'pending' ? "All caught up! No pending bills." : "No payment history found."}
            </Text>
          </View>
        }
      />

      {/* Bill Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1} 
            onPress={() => setDetailModalVisible(false)} 
          />
          <View style={styles.detailModalContent}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bill Details</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {selectedBill && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: hp(4) }}>
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction Type</Text>
                    <Text style={styles.detailValue}>{selectedBill.type}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bill Number</Text>
                    <Text style={styles.detailValue}>{selectedBill.billNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Billing Date</Text>
                    <Text style={styles.detailValue}>{selectedBill.date}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: selectedBill.status === 'pending' ? 'rgba(133,1,17,0.1)' : 'rgba(56,142,60,0.1)' }]}>
                      <Text style={[styles.statusText, { color: selectedBill.status === 'pending' ? theme.colors.primary : "#388E3C" }]}>
                        {selectedBill.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.detailDivider} />
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.totalLabel}>Total Payable</Text>
                    <Text style={styles.totalValue}>₹{selectedBill.amount.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {selectedBill.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.modalPayButton}
                    onPress={() => {
                      setDetailModalVisible(false);
                      setMaintenanceModalVisible(true);
                    }}
                  >
                    <LinearGradient
                      colors={[theme.colors.primary, "#b50d29"]}
                      style={styles.modalPayGradient}
                    >
                      <Text style={styles.modalPayText}>CONTINUE TO PAYMENT</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Maintenance Modal */}
      <Modal visible={maintenanceModalVisible} animationType="fade" transparent onRequestClose={() => setMaintenanceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#FF6B6B', '#D32F2F']} style={styles.modalHeader}>
              <Ionicons name="construct" size={40} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.modalBody}>
              <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark} align="center" style={{ marginBottom: hp(1) }}>
                Processing Bill
              </ResponsiveText>
              <Text style={styles.modalMessage}>
                Payment processing for {selectedBill?.billNumber} (₹{selectedBill?.amount?.toLocaleString('en-IN')}) is under development.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={() => setMaintenanceModalVisible(false)}>
                <Text style={styles.modalButtonText}>GOT IT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
  },
  backButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginHorizontal: wp(5),
    borderRadius: 12,
    marginTop: hp(1),
    marginBottom: hp(2),
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: hp(1.5),
    alignItems: 'center',
    position: 'relative'
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: rf(13),
    color: 'rgba(0,0,0,0.5)',
    fontWeight: '600'
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '30%',
    height: 3,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3
  },
  listContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(5),
  },
  loadingItem: {
    padding: wp(4),
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: hp(1.5),
  },
  billCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(1.5),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: { elevation: 2 }
    })
  },
  billIconContainer: { marginRight: wp(3) },
  iconCircle: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  billInfo: { flex: 1 },
  billType: {
    fontSize: rf(14),
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  billId: {
    fontSize: rf(12),
    color: 'rgba(0,0,0,0.6)',
    marginTop: 2
  },
  billDate: {
    fontSize: rf(10),
    color: 'rgba(0,0,0,0.4)',
    marginTop: 2
  },
  billAction: { alignItems: 'flex-end' },
  billAmount: {
    fontSize: rf(15),
    fontWeight: '800',
    marginBottom: hp(1)
  },
  paySmallButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: 8,
  },
  paySmallButtonText: {
    color: COLORS.white,
    fontSize: rf(10),
    fontWeight: 'bold'
  },
  paidBadge: {
    backgroundColor: 'rgba(56,142,60,0.1)',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56,142,60,0.2)'
  },
  paidBadgeText: {
    color: '#388E3C',
    fontSize: rf(9),
    fontWeight: '900'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(10)
  },
  emptyText: {
    fontSize: rf(13),
    color: 'rgba(0,0,0,0.3)',
    marginTop: hp(2),
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  detailModalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: wp(6),
    paddingTop: hp(1.5),
    paddingBottom: hp(2),
    maxHeight: '85%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  modalTitle: {
    fontSize: rf(22),
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 2,
  },
  detailCard: {
    backgroundColor: '#FBFBFB',
    borderRadius: 20,
    padding: wp(5),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  detailLabel: {
    fontSize: rf(14),
    color: '#757575',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: rf(15),
    fontWeight: '700',
    color: '#212121',
  },
  statusBadge: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.6),
    borderRadius: 15,
  },
  statusText: {
    fontSize: rf(11),
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginVertical: hp(1.5),
  },
  totalLabel: {
    fontSize: rf(16),
    fontWeight: '800',
    color: '#424242',
  },
  totalValue: {
    fontSize: rf(22),
    fontWeight: '900',
    color: theme.colors.primary,
  },
  modalPayButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: hp(1),
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: { elevation: 5 }
    })
  },
  modalPayGradient: {
    paddingVertical: hp(2.2),
    alignItems: 'center',
  },
  modalPayText: {
    color: COLORS.white,
    fontSize: rf(16),
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '80%',
    overflow: 'hidden',
    elevation: 15,
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  modalBody: {
    padding: wp(6),
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: rf(12),
    color: "rgba(0,0,0,0.6)",
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: rf(18),
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(10),
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: rf(12),
    fontWeight: 'bold',
  },
});

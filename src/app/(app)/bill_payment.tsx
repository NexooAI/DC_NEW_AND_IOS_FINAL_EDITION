import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator } from 'react-native';
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

// Mock Data Type
interface BillDetails {
  name: string;
  mobile: string;
  billNumber: string;
  amount: number;
}

export default function BillPayment() {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [billData, setBillData] = useState<BillDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setErrorMsg('Please enter a valid Bill Number.');
      setBillData(null);
      return;
    }

    setIsSearching(true);
    setErrorMsg('');
    setBillData(null);

    // Simulate API fetch delay
    setTimeout(() => {
      setIsSearching(false);
      // Mock result (in reality, API handles this)
      if (searchQuery.trim().length > 3) {
        setBillData({
          name: "Ramesh Kumar",
          mobile: "+91 9876543210",
          billNumber: searchQuery.trim().toUpperCase(),
          amount: 12500,
        });
      } else {
        setErrorMsg('Bill not found. Please check the number.');
      }
    }, 1200);
  };

  const handlePay = () => {
    setMaintenanceModalVisible(true);
  };

  const handleCloseMaintenanceModal = () => {
    setMaintenanceModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient
        colors={["rgba(133,1,17,0.05)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
          Bill Payment
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleContainer}>
          <ResponsiveText variant="title" weight="bold" color={theme.colors.primary} align="center" style={styles.mainTitle}>
            Fast & Secure Payments
          </ResponsiveText>
          <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
            Enter your bill number to fetch details
          </ResponsiveText>
          <View style={styles.decorativeLine} />
        </View>

        {/* Search Input Card */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="search-outline" size={rf(18)} color={theme.colors.primary} />
            </View>
            <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.primary}>
              Find Your Bill
            </ResponsiveText>
          </View>
          
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="receipt-outline" size={rf(18)} color="rgba(0,0,0,0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ex: INV-00123"
                placeholderTextColor="rgba(0,0,0,0.4)"
                value={searchQuery}
                onChangeText={(val) => {
                  setSearchQuery(val);
                  if (errorMsg) setErrorMsg('');
                }}
                autoCapitalize="characters"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={rf(18)} color="rgba(0,0,0,0.4)" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity 
              style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]} 
              onPress={handleSearch}
              disabled={!searchQuery.trim() || isSearching}
            >
              <Text style={styles.searchButtonText}>Retrieve</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <ResponsiveText variant="body" size="xs" color="#D32F2F" style={{ marginTop: hp(1) }}>
              {errorMsg}
            </ResponsiveText>
          ) : null}

          {isSearching && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <ResponsiveText variant="body" size="sm" color="rgba(0,0,0,0.6)" style={{ marginLeft: wp(2) }}>
                Fetching Details...
              </ResponsiveText>
            </View>
          )}
        </View>

        {/* Fetched Bill Data Card */}
        {billData && !isSearching && (
          <View style={styles.resultsCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.8)", "rgba(255,255,255,1)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.resultsHeader}>
              <Ionicons name="checkmark-circle" size={rf(20)} color="#388E3C" />
              <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark} style={{ marginLeft: wp(2) }}>
                Bill Details Found
              </ResponsiveText>
            </View>

            <View style={styles.dataGrid}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Customer Name</Text>
                <Text style={styles.dataValue}>{billData.name}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Mobile Number</Text>
                <Text style={styles.dataValue}>{billData.mobile}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Bill Number</Text>
                <Text style={styles.dataValue}>{billData.billNumber}</Text>
              </View>
              
              {/* Highlighted Amount Box */}
              <View style={styles.amountBox}>
                <Text style={styles.amountLabel}>Total Payable Amount</Text>
                <Text style={styles.amountValue}>
                  ₹ {billData.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity style={styles.payButton} onPress={handlePay} activeOpacity={0.9}>
              <LinearGradient
                colors={["#DAA520", "#b8860b"]}
                style={styles.payButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="card" size={rf(18)} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.payButtonText}>PAY AMOUNT</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Maintenance Modal */}
      <Modal visible={maintenanceModalVisible} animationType="fade" transparent onRequestClose={handleCloseMaintenanceModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient colors={['#FF6B6B', '#D32F2F']} style={styles.modalHeader}>
              <Ionicons name="construct" size={40} color={COLORS.white} />
            </LinearGradient>
            <View style={styles.modalBody}>
              <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark} align="center" style={{ marginBottom: hp(1) }}>
                Server Processing
              </ResponsiveText>
              <Text style={styles.modalMessage}>
                Payment processing endpoint is under development. Soon, this will debit ₹{billData?.amount?.toLocaleString('en-IN')} and reflect on the server.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleCloseMaintenanceModal}>
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
  container: { 
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(1),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { 
    padding: wp(4), 
    paddingTop: 0,
    paddingBottom: hp(8) 
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: hp(2),
  },
  mainTitle: {
    fontSize: rf(24),
    marginBottom: hp(0.5),
  },
  subtitle: {
    fontSize: rf(12),
    marginBottom: hp(2),
  },
  decorativeLine: {
    width: wp(15),
    height: 3,
    backgroundColor: "#DAA520",
    borderRadius: 2,
  },
  cardContainer: { 
    backgroundColor: COLORS.white, 
    borderRadius: 20, 
    padding: wp(4), 
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.1)", 
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: hp(2) 
  },
  iconCircle: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: "rgba(133,1,17,0.1)", 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: wp(3),
    height: hp(6),
    marginRight: wp(2),
  },
  inputIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: rf(14),
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  clearButton: {
    padding: wp(1),
  },
  searchButton: {
    backgroundColor: theme.colors.primary,
    height: hp(6),
    paddingHorizontal: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  searchButtonDisabled: {
    backgroundColor: "rgba(133,1,17,0.5)",
  },
  searchButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: rf(12),
  },
  loaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(2),
  },
  resultsCard: {
    borderRadius: 20,
    marginTop: hp(1),
    padding: wp(4),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(218,165,32,0.3)", // Gold subtle border
    elevation: 8,
    shadowColor: "#DAA520",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    paddingHorizontal: wp(2),
  },
  dataGrid: {
    backgroundColor: "rgba(0,0,0,0.02)",
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(2),
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.8),
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginVertical: hp(0.5),
  },
  dataLabel: {
    fontSize: rf(13),
    color: "rgba(0,0,0,0.6)",
    fontWeight: '500',
  },
  dataValue: {
    fontSize: rf(14),
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  amountBox: {
    marginTop: hp(2),
    backgroundColor: "rgba(133,1,17,0.05)",
    borderRadius: 8,
    padding: wp(3),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(133,1,17,0.1)",
  },
  amountLabel: {
    fontSize: rf(12),
    color: theme.colors.primary,
    marginBottom: hp(0.5),
    fontWeight: '600',
  },
  amountValue: {
    fontSize: rf(22),
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  payButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  payButtonGradient: {
    paddingVertical: hp(2),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: rf(14),
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '80%',
    overflow: 'hidden',
    elevation: 15,
  },
  modalHeader: {
    padding: wp(6),
    alignItems: 'center',
    justifyContent: 'center',
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

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useGlobalStore from '@/store/global.store';
import { Slider } from '@miblanchard/react-native-slider';
// AppHeader is now handled by the layout wrapper
import { formatGoldWeight } from '@/utils/imageUtils';
import { theme } from '@/constants/theme';

const ADVANCE_PERCENTS = [5, 10, 20, 30];

export default function JoinAdvanceGold() {
  const router = useRouter();
  const { user } = useGlobalStore();
  const params = useLocalSearchParams();

  // State
  const [amount, setAmount] = useState('50000');
  const [goldRate, setGoldRate] = useState(6000); // TODO: fetch real rate
  const [advancePercent, setAdvancePercent] = useState(ADVANCE_PERCENTS[0]);
  const [goldGrams, setGoldGrams] = useState(parseFloat('50000') / 6000);
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);

  // Derived
  const amountNum = parseFloat(amount) || 0;
  // goldGrams is now a state
  const advancePay = amountNum * (advancePercent / 100);
  const pendingPay = amountNum - advancePay;

  // Set advance percent from params if available
  useEffect(() => {
    if (params.advancePercent) {
      const percent = parseInt(params.advancePercent as string);
      if (ADVANCE_PERCENTS.includes(percent)) {
        setAdvancePercent(percent);
      }
    }
  }, [params.advancePercent]);

  // Sync goldGrams when amount changes
  useEffect(() => {
    const amt = parseFloat(amount);
    if (!isNaN(amt) && goldRate) {
      setGoldGrams(amt / goldRate);
    }
  }, [amount, goldRate]);

  // Sync amount when goldGrams changes
  useEffect(() => {
    if (goldGrams && goldRate) {
      const newAmount = (goldGrams * goldRate).toFixed(0);
      if (parseFloat(amount) !== parseFloat(newAmount)) {
        setAmount(newAmount);
      }
    }
  }, [goldGrams, goldRate]);

  // Autofill user details
  const userName = user?.name || '';
  const userMobile = user?.mobile || '';

  const handleJoinButton = () => {
    setMaintenanceModalVisible(true);
  };

  const handleCloseMaintenanceModal = () => {
    setMaintenanceModalVisible(false);
  };

  // TODO: fetch gold rate from API if needed

  return (
    <SafeAreaView style={styles.container}>
      {/* Header is now handled by the layout wrapper */}

      <LinearGradient
        colors={[theme.colors.bgBlackHeavy, theme.colors.bgBlackMedium, theme.colors.bgBlackLight]}
        style={styles.gradientBackground}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Royal Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>SRI Murugan Gold Advance</Text>
            <Text style={styles.subtitle}>Exclusive Premium Investment</Text>
          </View>

          {/* Amount Input + Slider */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Ionicons name="cash" size={24} color={theme.colors.gold} />
              <Text style={styles.cardTitle}>Investment Amount</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.royalInput}
                keyboardType="numeric"
                value={amount}
                onChangeText={val => setAmount(val.replace(/[^0-9.]/g, ''))}
                placeholder="Enter amount"
                placeholderTextColor={theme.colors.additional.formTextLight}
                maxLength={8}
              />
              <Slider
                value={amountNum}
                minimumValue={5000}
                maximumValue={500000}
                step={1000}
                onValueChange={(val: number[]) => setAmount(String(Math.round(val[0])))}
                containerStyle={{ marginTop: 12 }}
                thumbTintColor={theme.colors.gold}
                minimumTrackTintColor={theme.colors.gold}
                maximumTrackTintColor={theme.colors.additional.formTextMedium}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
              />
            </View>
          </View>

          {/* Gold Grams Input + Slider */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Ionicons name="scale" size={24} color={theme.colors.gold} />
              <Text style={styles.cardTitle}>Gold Weight</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.royalInput}
                keyboardType="numeric"
                value={goldGrams ? formatGoldWeight(goldGrams).replace(' g', '') : ''}
                onChangeText={val => {
                  const grams = parseFloat(val);
                  if (!isNaN(grams)) setGoldGrams(grams);
                }}
                placeholder="Enter grams"
                placeholderTextColor={theme.colors.additional.formTextLight}
                maxLength={8}
              />
              <Slider
                value={goldGrams}
                minimumValue={0.5}
                maximumValue={500}
                step={0.5}
                onValueChange={(val: number[]) => setGoldGrams(Number(val[0]))}
                containerStyle={{ marginTop: 12 }}
                thumbTintColor={theme.colors.gold}
                minimumTrackTintColor={theme.colors.gold}
                maximumTrackTintColor={theme.colors.additional.formTextMedium}
                thumbStyle={styles.sliderThumb}
                trackStyle={styles.sliderTrack}
              />
            </View>
          </View>

          {/* Advance % Selector */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Ionicons name="trending-up" size={24} color={theme.colors.gold} />
              <Text style={styles.cardTitle}>Advance Percentage</Text>
            </View>
            <View style={styles.percentGrid}>
              {ADVANCE_PERCENTS.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.percentButton}
                  onPress={() => setAdvancePercent(p)}
                >
                  <LinearGradient
                    colors={advancePercent === p ? [theme.colors.gold, theme.colors.primary] : [theme.colors.bgBlackMedium, theme.colors.bgBlackLight]}
                    style={styles.percentGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.percentButtonText, advancePercent === p && styles.percentButtonTextActive]}>{p}%</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Royal Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
              <Text style={styles.summaryTitle}>Investment Summary</Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Gold Amount:</Text>
                <Text style={styles.summaryValue}>₹{amountNum ? amountNum.toLocaleString('en-IN') : '--'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Advance Payment ({advancePercent}%):</Text>
                <Text style={styles.summaryValue}>₹{advancePay ? advancePay.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '--'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Pending Amount:</Text>
                <Text style={styles.summaryValue}>₹{pendingPay ? pendingPay.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '--'}</Text>
              </View>
            </View>
          </View>

          {/* User Details */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#FFD700" />
              <Text style={styles.cardTitle}>Investor Details</Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput style={styles.royalInput} value={userName} editable={false} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile</Text>
              <TextInput style={styles.royalInput} value={userMobile?.toString()} editable={false} />
            </View>
          </View>

          {/* Royal Join Button */}
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinButton}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8C00']}
              style={styles.joinButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="diamond" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.joinButtonText}>JOIN SRI MURUGAN ADVANCE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>

      {/* Maintenance Modal */}
      <Modal
        visible={maintenanceModalVisible}
        animationType="fade"
        transparent
        onRequestClose={handleCloseMaintenanceModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.modalHeader}
            >
              <Ionicons name="construct" size={32} color="#fff" />
              <Text style={styles.modalTitle}>Under Maintenance</Text>
            </LinearGradient>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Payment processing is currently under maintenance. Please try again later.
              </Text>
              <Text style={styles.modalSubMessage}>
                We're working to improve our payment system for better service.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleCloseMaintenanceModal}
              >
                <Text style={styles.modalButtonText}>OK</Text>
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
  headerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
    textAlign: 'center',
    marginTop: 4
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 12
  },
  inputGroup: {
    marginBottom: 8
  },
  inputLabel: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 8,
    fontWeight: '500'
  },
  royalInput: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3
  },
  percentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  percentButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4
  },
  percentGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center'
  },
  percentButtonText: {
    color: '#E0E0E0',
    fontWeight: 'bold',
    fontSize: 16
  },
  percentButtonTextActive: {
    color: '#000',
    fontWeight: 'bold'
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 12
  },
  summaryContent: {
    gap: 12
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 16,
    color: '#E0E0E0',
    fontWeight: '500'
  },
  summaryValue: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  joinButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonIcon: {
    marginRight: 8
  },
  joinButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '85%',
    maxHeight: '60%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  modalHeader: {
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalMessage: {
    fontSize: 18,
    color: '#2C1810',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  modalSubMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 120,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
}); 
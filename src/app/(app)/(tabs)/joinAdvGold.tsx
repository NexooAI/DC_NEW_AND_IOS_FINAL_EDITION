import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import apiClient, { advanceBookingAPI } from '@/services/api';
import type { CreateAdvanceBookingPayload } from '@/services/api';

const { wp, hp, rf } = responsiveUtils;
const QUATERNARY_COLOR = theme.colors.quaternary || "#F2E6D2";

const getFirstValue = (...values: any[]) => values.find((value) => value !== undefined && value !== null && value !== '');

const extractPaymentLink = (responseData: any) => {
  const data = responseData?.data || responseData;
  const session = data?.session || data?.paymentSession || data?.payment_session;
  const bookingSession = data?.bookingId?.url || data?.booking?.url;
  return (
    data?.paymentLink ||
    data?.payment_link ||
    data?.paymentUrl ||
    data?.payment_url ||
    data?.payment_links?.web ||
    data?.paymentLinks?.web ||
    bookingSession?.payment_links?.web ||
    bookingSession?.paymentLinks?.web ||
    bookingSession?.links?.web ||
    bookingSession?.web ||
    bookingSession?.url ||
    session?.payment_links?.web ||
    session?.paymentLinks?.web ||
    session?.links?.web ||
    session?.web ||
    session?.url ||
    ''
  );
};

const extractOrderId = (responseData: any) => {
  const data = responseData?.data || responseData;
  const session = data?.session || data?.paymentSession || data?.payment_session;
  const bookingSession = data?.bookingId?.url || data?.booking?.url;
  return getFirstValue(
    data?.orderId,
    data?.order_id,
    data?.bookingId?.orderId,
    data?.bookingId?.order_id,
    bookingSession?.order_id,
    bookingSession?.orderId,
    session?.order_id,
    session?.orderId
  );
};

const extractBookingId = (responseData: any) => {
  const data = responseData?.data || responseData;
  return getFirstValue(
    data?.bookingId?.bookingId,
    data?.bookingId?.id,
    data?.booking_id,
    data?.bookingId,
    data?.id,
    data?.booking?.id
  );
};

export default function JoinAdvGold() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const router = useRouter();
  const { user } = useGlobalStore();
  const params = useLocalSearchParams();
  const metalType = String(params.metalType || 'GOLD').toUpperCase();

  // State
  const [goldRate, setGoldRate] = useState(6000);
  const [advancePercent, setAdvancePercent] = useState(5);
  const [goldGrams, setGoldGrams] = useState('1');
  const [amount, setAmount] = useState('6000');
  const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic config states
  const [advancePercents, setAdvancePercents] = useState<number[]>([5, 10, 20, 30]);
  const [percentToDays, setPercentToDays] = useState<Record<number, number>>({
    5: 30,
    10: 60,
    20: 90,
    30: 120
  });
  const [percentToMinGram, setPercentToMinGram] = useState<Record<number, number>>({
    5: 5,
    10: 5,
    20: 5,
    30: 5
  });
  const [percentToMaxGram, setPercentToMaxGram] = useState<Record<number, number>>({});
  const [percentToMinAmount, setPercentToMinAmount] = useState<Record<number, number>>({});
  const [percentToMaxAmount, setPercentToMaxAmount] = useState<Record<number, number>>({});
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Fetch configs from /advance-booking-config
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        setLoadingConfig(true);
        const response = await apiClient.get(`/advance-booking-config?metal_type=${metalType}&status=ACTIVE`);
        if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          const configs = response.data.data;
          const percents: number[] = [];
          const daysMap: Record<number, number> = {};
          const minGramsMap: Record<number, number> = {};
          const maxGramsMap: Record<number, number> = {};
          const minAmountsMap: Record<number, number> = {};
          const maxAmountsMap: Record<number, number> = {};

          // Sort by percentage ascending
          const sortedConfigs = [...configs].sort((a: any, b: any) => a.percentage - b.percentage);

          sortedConfigs.forEach((c: any) => {
            const pct = Math.round(parseFloat(c.percentage));
            percents.push(pct);
            daysMap[pct] = parseInt(c.booking_days);
            minGramsMap[pct] = parseFloat(c.min_gram || 0);
            maxGramsMap[pct] = parseFloat(c.max_gram || 0);
            minAmountsMap[pct] = parseFloat(c.min_booking_amount || 0);
            maxAmountsMap[pct] = parseFloat(c.max_booking_amount || 0);
          });

          setAdvancePercents(percents);
          setPercentToDays(daysMap);
          setPercentToMinGram(minGramsMap);
          setPercentToMaxGram(maxGramsMap);
          setPercentToMinAmount(minAmountsMap);
          setPercentToMaxAmount(maxAmountsMap);

          // Set initial default selection to the first percent if not already set by params
          if (percents.length > 0 && !params.advancePercent) {
            setAdvancePercent(percents[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching advance booking config:', error);
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfigs();
  }, [params.advancePercent, metalType]);

  // Fetch Gold/Silver Rate from server
  useEffect(() => {
    const fetchGoldRate = async () => {
      try {
        const response = await apiClient.get('/rates');
        if (response.data && response.data.data && response.data.data.length > 0) {
          const rates = response.data.data;
          // Sort by created_at descending (newest first)
          const sorted = [...rates].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestRate = sorted[0];
          if (latestRate) {
            const rateVal = metalType === 'SILVER' ? latestRate.silver_rate : latestRate.gold_rate;
            if (rateVal) {
              const rate = Math.round(parseFloat(rateVal));
              setGoldRate(rate);

              // Also dynamically update the default amount based on 1 gram
              const gramsNum = parseFloat(goldGrams) || 1;
              setAmount(Math.round(gramsNum * rate).toString());
            }
          }
        }
      } catch (error) {
        console.error('Error fetching rate:', error);
      }
    };
    fetchGoldRate();
  }, [metalType]);

  // Derived
  const amountNum = parseFloat(amount) || 0;
  const gramsNum = parseFloat(goldGrams) || 0;
  const activeMinGram = percentToMinGram[advancePercent] || 0;
  const activeMaxGram = percentToMaxGram[advancePercent] || 0;
  const activeMinAmount = percentToMinAmount[advancePercent] || 0;
  const activeMaxAmount = percentToMaxAmount[advancePercent] || 0;

  const isSubMinGram = activeMinGram > 0 && gramsNum < activeMinGram;
  const isSubMinAmount = activeMinAmount > 0 && amountNum < activeMinAmount;
  const isBelowMinLimit = isSubMinGram || isSubMinAmount;

  const isOverMaxGram = activeMaxGram > 0 && gramsNum > activeMaxGram;
  const isOverMaxAmount = activeMaxAmount > 0 && amountNum > activeMaxAmount;
  const isAboveMaxLimit = isOverMaxGram || isOverMaxAmount;

  const effectiveAdvancePercent = isBelowMinLimit ? 100 : advancePercent;
  const advancePay = amountNum * (effectiveAdvancePercent / 100);
  const pendingPay = amountNum - advancePay;

  // Handlers for Gold Weight
  const handleWeightIncrement = () => {
    const w = (parseFloat(goldGrams) || 0) + 1;
    setGoldGrams(w.toString());
    setAmount(Math.round(w * goldRate).toString());
  };
  const handleWeightDecrement = () => {
    const w = Math.max(0.25, (parseFloat(goldGrams) || 0) - 1);
    setGoldGrams(w.toString());
    setAmount(Math.round(w * goldRate).toString());
  };
  const handleWeightChangeText = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    setGoldGrams(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      setAmount(Math.round(num * goldRate).toString());
    } else {
      setAmount('');
    }
  };

  // Handlers for Amount
  const handleAmountIncrement = () => {
    const a = (parseFloat(amount) || 0) + 1000;
    setAmount(a.toString());
    setGoldGrams((a / goldRate).toFixed(3).replace(/\.?0+$/, ''));
  };
  const handleAmountDecrement = () => {
    const a = Math.max(1000, (parseFloat(amount) || 0) - 1000);
    setAmount(a.toString());
    setGoldGrams((a / goldRate).toFixed(3).replace(/\.?0+$/, ''));
  };
  const handleAmountChangeText = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      setGoldGrams((num / goldRate).toFixed(3).replace(/\.?0+$/, ''));
    } else {
      setGoldGrams('');
    }
  };

  // Set advance percent from params if available
  useEffect(() => {
    if (params.advancePercent && !loadingConfig) {
      const percent = parseInt(params.advancePercent as string);
      if (advancePercents.includes(percent)) {
        setAdvancePercent(percent);
      }
    }
  }, [params.advancePercent, loadingConfig, advancePercents]);

  // Pre-fill weight and amount when plan changes
  useEffect(() => {
    if (!loadingConfig && advancePercent) {
      const minGram = percentToMinGram[advancePercent] || 0;
      const initialGram = minGram > 0 ? minGram : 1;
      setGoldGrams(initialGram.toString());
      if (goldRate > 0) {
        setAmount(Math.round(initialGram * goldRate).toString());
      }
    }
  }, [advancePercent, loadingConfig, goldRate]);

  // Autofill user details
  const userName = user?.name || '';
  const userMobile = user?.mobile ? String(user.mobile) : '';

  const handleJoinButton = async () => {
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }

    if (isAboveMaxLimit) {
      const errorMsg = isOverMaxGram && isOverMaxAmount
        ? `Booking weight exceeds the maximum limit of ${activeMaxGram}g and amount exceeds ₹${activeMaxAmount.toLocaleString('en-IN')}.`
        : isOverMaxGram
        ? `Booking weight exceeds the maximum limit of ${activeMaxGram}g.`
        : `Booking amount exceeds the maximum limit of ₹${activeMaxAmount.toLocaleString('en-IN')}.`;
      Alert.alert('Limit Exceeded', errorMsg);
      return;
    }

    setIsProcessing(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (percentToDays[advancePercent] || 30));

      const userId = getFirstValue((user as any)?.userId, user?.id);
      if (!userId) {
        Alert.alert('Error', 'User details not found. Please login again.');
        setIsProcessing(false);
        return;
      }

      // Verify KYC status before transaction
      const kycResponse = await apiClient.get(`/kyc/status/${userId}`);
      const isKycCompleted = kycResponse.data && (kycResponse.data.kyc_status === "Completed" || kycResponse.data.data);
      if (!isKycCompleted) {
        Alert.alert(
          'KYC Required',
          'Please complete your KYC details to continue with this transaction.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsProcessing(false) },
            {
              text: 'Complete KYC',
              onPress: () => {
                setIsProcessing(false);
                router.replace('/home/kyc');
              }
            }
          ]
        );
        setIsProcessing(false);
        return;
      }

      const accountNumber = getFirstValue((user as any)?.accountNumber, (user as any)?.accountNo, (user as any)?.accNo) ?? '';

      console.log("[DEBUG Payment Flow] Routing to paymentNewOverView with params for advance booking");

      router.push({
        pathname: '/(tabs)/home/paymentNewOverView',
        params: {
          paymentType: 'advance_booking',
          goldWeight: String(goldGrams),
          totalAmount: String(amountNum),
          ratePerGram: String(goldRate),
          bookingAmount: String(advancePay),
          expiryDate: expiryDate.toISOString().split('T')[0],
          metalType: metalType,
          advancePercent: String(effectiveAdvancePercent),
          bookingDays: String(percentToDays[advancePercent] || 30),
          amount: String(advancePay),
          userDetails: JSON.stringify({
            userId: String(userId),
            name: userName,
            mobile: userMobile,
            email: user?.email || '',
            accountNo: String(accountNumber),
          }),
        },
      });
    } catch (error: any) {
      console.error('[DEBUG Payment Flow] Booking Error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseMaintenanceModal = () => {
    setMaintenanceModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Background */}
      <StatusBar barStyle="dark-content" backgroundColor={QUATERNARY_COLOR} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: QUATERNARY_COLOR }]} />
      <LinearGradient
        colors={["rgba(133,1,17,0.05)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          router.replace('/(tabs)/home');
          router.replace('/(app)/gold_advance');
        }} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.textDark}>
          Join Advance {metalType === 'SILVER' ? 'Silver' : 'Gold'}
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Royal Title Section */}
        <View style={styles.titleContainer}>
          <ResponsiveText variant="title" weight="bold" color={theme.colors.textDark} align="center" style={styles.mainTitle}>
            Secure Your Future
          </ResponsiveText>
          <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
            Premium {metalType === 'SILVER' ? 'silver' : 'gold'} advance tailored for you
          </ResponsiveText>
          <View style={styles.decorativeLine} />
        </View>

        {/* Card 1: Plan Selection (Percentage Tabs moved to top!) */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="pie-chart-outline" size={rf(18)} color={theme.colors.textDark} />
            </View>
            <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark}>
              Select Plan Percentage
            </ResponsiveText>
          </View>
          <View style={styles.percentGrid}>
            {advancePercents.map((p) => {
              const isActive = effectiveAdvancePercent === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.percentButton, isActive && styles.percentButtonActive]}
                  onPress={() => {
                    if (isBelowMinLimit) {
                      const lockMsg = isSubMinGram && isSubMinAmount
                        ? `Weight entered (${gramsNum}g) is below ${activeMinGram}g and amount is below ₹${activeMinAmount.toLocaleString('en-IN')}. Only 100% full payment is allowed.`
                        : isSubMinGram
                        ? `Weight entered (${gramsNum}g) is below ${activeMinGram}g. Only 100% full payment is allowed.`
                        : `Amount entered (₹${amountNum}) is below ₹${activeMinAmount.toLocaleString('en-IN')}. Only 100% full payment is allowed.`;
                      Alert.alert("Advance Payment Locked", lockMsg);
                      return;
                    }
                    setAdvancePercent(p);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.percentButtonText, isActive && styles.percentButtonTextActive]}>{p}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Card 2: Weight & Amount Calculator inputs */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Ionicons name="scale-outline" size={rf(18)} color={theme.colors.textDark} />
            </View>
            <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark}>
              {metalType === 'SILVER' ? 'Silver' : 'Gold'} Calculator
            </ResponsiveText>
          </View>
          <View style={styles.inputGroup}>
            {/* Metal Weight Control */}
            <ResponsiveText variant="body" size="sm" color="rgba(0,0,0,0.6)" style={{ marginBottom: hp(1) }}>
              Enter Weight
            </ResponsiveText>
            <View style={styles.weightControlRow}>
              <TouchableOpacity onPress={handleWeightDecrement} style={styles.controlButton}>
                <Ionicons name="remove" size={rf(20)} color={theme.colors.textDark} />
              </TouchableOpacity>

              <View style={styles.weightInputWrapper}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="numeric"
                  value={goldGrams}
                  onChangeText={handleWeightChangeText}
                  maxLength={8}
                />
                <Text style={styles.unitText}>grams</Text>
              </View>

              <TouchableOpacity onPress={handleWeightIncrement} style={styles.controlButton}>
                <Ionicons name="add" size={rf(20)} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>

            {/* Link Icon */}
            <View style={styles.linkIconContainer}>
              <Ionicons name="link-outline" size={rf(16)} color="rgba(0,0,0,0.2)" />
            </View>

            {/* Amount Control */}
            <ResponsiveText variant="body" size="sm" color="rgba(0,0,0,0.6)" style={{ marginBottom: hp(1) }}>
              Advance Amount (@ ₹ {goldRate.toLocaleString('en-IN')}/g)
            </ResponsiveText>
            <View style={styles.weightControlRow}>
              <TouchableOpacity onPress={handleAmountDecrement} style={styles.controlButton}>
                <Ionicons name="remove" size={rf(20)} color={theme.colors.textDark} />
              </TouchableOpacity>

              <View style={styles.weightInputWrapper}>
                <Text style={[styles.unitText, { marginLeft: 0, marginRight: wp(2) }]}>₹</Text>
                <TextInput
                  style={[styles.weightInput, { textAlign: 'left' }]}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={handleAmountChangeText}
                  maxLength={10}
                />
              </View>

              <TouchableOpacity onPress={handleAmountIncrement} style={styles.controlButton}>
                <Ionicons name="add" size={rf(20)} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Minimum Limit Validation Warning Banner */}
        {isBelowMinLimit && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              You are going below the minimum allowed limit in this plan. If you go below minimum, you must make a full payment (100%).
            </Text>
          </View>
        )}

        {/* Maximum Limit Validation Warning Banner */}
        {isAboveMaxLimit && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              Maximum weight/limit is not allowed. Please enter a value within the limits.
            </Text>
          </View>
        )}

        {/* Royal Summary Card */}
        <LinearGradient
          colors={["#850111", "#a30115"]}
          style={styles.summaryCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glossy Overlay */}
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "transparent", "rgba(0,0,0,0.2)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.summaryHeader}>
            <Ionicons name="shield-checkmark" size={rf(20)} color="#DAA520" />
            <ResponsiveText variant="title" size="sm" weight="bold" color={COLORS.white} style={{ marginLeft: wp(2) }}>
              Advance Summary
            </ResponsiveText>
            {advancePercent && (
              <View style={styles.daysBadge}>
                <Ionicons name="time" size={rf(10)} color="#1a1a1a" style={{ marginRight: wp(1) }} />
                <Text style={styles.daysBadgeText}>{percentToDays[advancePercent] || 30} Days</Text>
              </View>
            )}
          </View>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total {metalType === 'SILVER' ? 'Silver' : 'Gold'} Amount:</Text>
              <Text style={styles.summaryValue}>₹{amountNum ? amountNum.toLocaleString('en-IN') : '--'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Advance ({effectiveAdvancePercent}%):</Text>
              <Text style={styles.summaryValueHighlight}>₹{advancePay ? advancePay.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '--'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Booking Period:</Text>
              <Text style={styles.summaryValue}>{percentToDays[advancePercent] || 0} Days</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Balance:</Text>
              <Text style={styles.summaryValue}>₹{pendingPay ? pendingPay.toLocaleString('en-IN', { maximumFractionDigits: 0 }) : '--'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={{ height: hp(2) }} />

        {/* Royal Join Button */}
        <TouchableOpacity
          style={[styles.joinButton, (isProcessing || isAboveMaxLimit) && { opacity: 0.5 }]}
          onPress={handleJoinButton}
          disabled={isProcessing || isAboveMaxLimit}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primary]}
            style={styles.joinButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isProcessing ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="diamond" size={rf(18)} color={COLORS.white} style={styles.buttonIcon} />
                <Text style={styles.joinButtonText}>PROCEED TO PAY</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
                Under Maintenance
              </ResponsiveText>
              <Text style={styles.modalMessage}>
                Payment processing is currently under maintenance. Please try again later.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={handleCloseMaintenanceModal}>
                <Text style={styles.modalButtonText}>OKAY</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QUATERNARY_COLOR,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(211, 47, 47, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(211, 47, 47, 0.2)",
    borderRadius: 12,
    padding: wp(4),
    marginHorizontal: wp(5),
    marginBottom: hp(2),
  },
  warningText: {
    flex: 1,
    fontSize: rf(11),
    color: "#D32F2F",
    fontWeight: "600",
    lineHeight: rf(16),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(0.5),
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
    borderColor: "rgba(218,165,32,0.3)", // Gold subtle border
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
    backgroundColor: "rgba(133,1,17,0.1)", // Primary with opacity
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  inputGroup: {
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: wp(4),
  },
  weightControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(2),
  },
  controlButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: "rgba(133,1,17,0.1)",
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  weightInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: wp(4),
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: wp(4),
  },
  weightInput: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: hp(1.5),
    fontSize: rf(18),
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: rf(14),
    color: "rgba(0,0,0,0.5)",
    marginLeft: wp(2),
  },
  calculatedAmountContainer: {
    backgroundColor: "#f9f9f9",
    padding: wp(4),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  linkIconContainer: {
    alignItems: 'center',
    marginVertical: hp(-0.5),
    zIndex: 1,
  },
  percentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  percentButton: {
    width: '23%',
    paddingVertical: hp(1.5),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: 'center',
    backgroundColor: "#f9f9f9",
  },
  percentButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  percentButtonText: {
    color: theme.colors.textDark,
    fontWeight: 'bold',
    fontSize: rf(12)
  },
  percentButtonTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    borderRadius: 20,
    padding: wp(5),
    marginTop: hp(1),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Changed to between to allow badge on right
    marginBottom: hp(2)
  },
  daysBadge: {
    backgroundColor: '#DAA520',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(3),
  },
  daysBadgeText: {
    color: '#1a1a1a',
    fontSize: rf(10),
    fontWeight: 'bold',
  },
  summaryContent: {
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(0.5),
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: hp(0.5),
  },
  summaryLabel: {
    fontSize: rf(12),
    color: "rgba(255,255,255,0.8)",
  },
  summaryValue: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: rf(14)
  },
  summaryValueHighlight: {
    color: "#DAA520",
    fontWeight: 'bold',
    fontSize: rf(16)
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  joinButtonGradient: {
    paddingVertical: hp(2),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  buttonIcon: {
    marginRight: wp(2)
  },
  joinButtonText: {
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
    fontSize: rf(11),
    color: "rgba(0,0,0,0.6)",
    textAlign: 'center',
    marginBottom: hp(3),
    lineHeight: rf(16),
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
}) }

var styles = getStyles(theme);; 

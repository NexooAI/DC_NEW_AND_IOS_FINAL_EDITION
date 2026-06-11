import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from '@/hooks/useTranslation';
import { theme } from '@/constants/theme';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import { billsAPI } from '@/services/api';
import RatingModal, { useRatingPrompt } from '@/components/RatingModal';

const { wp, hp, rf } = responsiveUtils;

export default function BookingPaymentSuccess() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();

  const {
    showRating,
    checkAndShowRating,
    hideRating,
  } = useRatingPrompt();

  useEffect(() => {
    // Show rating prompt after completing a payment (1 second delay)
    const ratingTimer = setTimeout(() => {
      checkAndShowRating();
    }, 1000);
    return () => clearTimeout(ratingTimer);
  }, []);

  const amount = params.amount as string;
  const txnId = params.txnId as string;
  const orderId = params.orderId as string;
  const type = params.type as string;
  const userId = params.userId as string;
  const isBillPayment = type === 'bill';

  const goBack = () => {
    router.replace(isBillPayment ? '/(app)/bill_payment' : '/(app)/dashboard');
  };

  useEffect(() => {
    const onBackPress = () => {
      goBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [isBillPayment]);

  useEffect(() => {
    if (isBillPayment && userId) {
      billsAPI.getUserBills(userId).catch(() => undefined);
    }
  }, [isBillPayment, userId]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#E8F5E9', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
        </View>

        <ResponsiveText variant="title" weight="bold" color="#2E7D32" align="center" style={styles.title}>
          {t("paymentSuccess")}
        </ResponsiveText>
        <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
          {t("paymentSuccessMessage")}
        </ResponsiveText>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("amountPaid")}</Text>
            <Text style={styles.detailValue}>₹{amount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("transactionId")}</Text>
            <Text style={styles.detailValue}>{txnId || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t("orderId")}</Text>
            <Text style={styles.detailValue}>{orderId || 'N/A'}</Text>
          </View>
        </View>

        {isBillPayment ? (
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={goBack}
          >
            <Text style={styles.doneButtonText}>{t("backToBills").toUpperCase()}</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => router.replace('/(tabs)/home/BookingHistory')}
            >
              <Text style={styles.historyButtonText}>{t("showAdvanceHistory").toUpperCase()}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeButton}
              onPress={goBack}
            >
              <Text style={styles.homeButtonText}>{t("backToHome").toUpperCase()}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <RatingModal
        visible={showRating}
        onClose={hideRating}
        appName="DC Jewellers"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: wp(5), alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: hp(3) },
  title: { fontSize: rf(24), marginBottom: hp(1) },
  subtitle: { fontSize: rf(14), marginBottom: hp(4) },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: wp(5),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: hp(4),
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hp(1) },
  detailLabel: { fontSize: rf(14), color: '#666' },
  detailValue: { fontSize: rf(14), fontWeight: 'bold', color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: hp(1) },
  doneButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: rf(14), fontWeight: 'bold' },
  historyButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
  },
  historyButtonText: { color: '#fff', fontSize: rf(14), fontWeight: 'bold' },
  homeButton: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  homeButtonText: { color: theme.colors.primary, fontSize: rf(14), fontWeight: 'bold' },
});

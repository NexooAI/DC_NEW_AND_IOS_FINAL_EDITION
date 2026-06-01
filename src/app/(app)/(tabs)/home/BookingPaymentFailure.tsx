import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';
import ResponsiveText from '@/components/ResponsiveText';
import { responsiveUtils } from '@/utils/responsiveUtils';
import { billsAPI } from '@/services/api';

const { wp, hp, rf } = responsiveUtils;

export default function BookingPaymentFailure() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const amount = params.amount as string;
  const message = params.message as string;
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
      <LinearGradient colors={['#FFEBEE', '#FFFFFF']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={100} color="#F44336" />
        </View>

        <ResponsiveText variant="title" weight="bold" color="#D32F2F" align="center" style={styles.title}>
          Payment Failed!
        </ResponsiveText>
        <ResponsiveText variant="body" color="rgba(0,0,0,0.6)" align="center" style={styles.subtitle}>
          {message || 'Your transaction could not be completed.'}
        </ResponsiveText>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Attempted</Text>
            <Text style={styles.detailValue}>₹{amount || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{orderId || 'N/A'}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={goBack}
        >
          <Text style={styles.retryButtonText}>{isBillPayment ? 'BACK TO BILLS' : 'TRY AGAIN'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/(app)/dashboard')}
        >
          <Text style={styles.homeButtonText}>GO TO HOME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: wp(5), alignItems: 'center', justifyContent: 'center' },
  iconContainer: { marginBottom: hp(3) },
  title: { fontSize: rf(24), marginBottom: hp(1) },
  subtitle: { fontSize: rf(14), marginBottom: hp(4), textAlign: 'center' },
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
  retryButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: hp(2),
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: hp(2),
  },
  retryButtonText: { color: '#fff', fontSize: rf(14), fontWeight: 'bold' },
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

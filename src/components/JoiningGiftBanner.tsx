import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export interface JoiningGiftData {
  gift_name?: string;
  status?: 'ALLOTTED' | 'DELIVERED' | string;
  handover_date?: string;
  weight_grams?: number | string;
  sku?: string;
}

interface Props {
  gift?: JoiningGiftData | null;
  onPress?: () => void;
}

export const JoiningGiftBanner: React.FC<Props> = ({ gift, onPress }) => {
  const router = useRouter();
  const pathname = usePathname();
  if (!gift || !gift.gift_name) return null;

  const isDelivered = gift.status === 'DELIVERED';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({ pathname: '/(app)/gifts', params: { from: pathname || '/(app)/(tabs)/home' } } as any);
    }
  };

  return (
    <TouchableOpacity
      testID="joining-gift-banner"
      activeOpacity={0.88}
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: isDelivered ? '#F0FDF4' : '#FFFBEB',
          borderColor: isDelivered ? '#BBF7D0' : '#FDE68A',
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: isDelivered ? '#DCFCE7' : '#FEF3C7' },
            ]}
          >
            <Text style={{ fontSize: 18 }}>{isDelivered ? '🎁' : '🎉'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.badgeTitle,
                { color: isDelivered ? '#166534' : '#B45309' },
              ]}
            >
              {isDelivered ? 'Promotional Gift Delivered' : 'Promotional Gift Allotted'}
            </Text>
            <Text testID="gift-name" style={styles.giftName}>
              {gift.gift_name}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isDelivered ? '#22C55E' : '#F59E0B' },
          ]}
        >
          <Text testID="gift-status" style={styles.statusText}>
            {isDelivered ? 'COLLECTED' : 'READY AT STORE'}
          </Text>
        </View>
      </View>

      <Text testID="gift-description" style={[styles.description, { color: isDelivered ? '#15803D' : '#78350F' }]}>
        {isDelivered
          ? `Gift received at showroom${gift.handover_date ? ' on ' + new Date(gift.handover_date).toLocaleDateString() : ''}. Thank you!`
          : 'Visit your nearest branch showroom to collect your welcome gift by showing your scheme account number.'}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: isDelivered ? '#166534' : '#B45309' }]}>
          Tap to view full gift details & store directions
        </Text>
        <Ionicons name="chevron-forward" size={13} color={isDelivered ? '#166534' : '#B45309'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  giftName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default JoiningGiftBanner;

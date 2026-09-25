import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ParsedSchemeV2 } from './types';
import { parseSchemeV2 } from './schemeThemes';
import { SchemeCardV2 } from './SchemeCardV2';
import { SCHEME_ASSETS } from './schemeAssets';

interface SchemesScreenV2Props {
  rawSchemes: any[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onBack: () => void;
  onKnowMore: (scheme: ParsedSchemeV2) => void;
  onJoinScheme: (scheme: ParsedSchemeV2) => void;
  language?: string;
  isNested?: boolean;
}

const { width } = Dimensions.get('window');

export const SchemesScreenV2: React.FC<SchemesScreenV2Props> = ({
  rawSchemes,
  isLoading,
  onRefresh,
  onBack,
  onKnowMore,
  onJoinScheme,
  language = 'en',
  isNested = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gold' | 'silver' | 'diamond'>('gold');
  const [selectedType, setSelectedType] = useState<'all' | 'fixed' | 'flexi'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'recommended' | 'amount_asc' | 'amount_desc'>('recommended');

  // Parse raw schemes to rich V2 models
  const parsedSchemes = useMemo(() => {
    if (!Array.isArray(rawSchemes)) return [];
    return rawSchemes
      .filter((s) => s && (s.ACTIVE === 'Y' || s.ACTIVE === undefined))
      .map((s, index) => parseSchemeV2(s, language, index));
  }, [rawSchemes, language]);

  // Check available categories
  const hasSilver = useMemo(
    () => parsedSchemes.some((s) => s.metal === 'silver'),
    [parsedSchemes]
  );
  const hasDiamond = useMemo(
    () => parsedSchemes.some((s) => s.metal === 'diamond'),
    [parsedSchemes]
  );

  // Filter schemes by category and type
  const filteredSchemes = useMemo(() => {
    return parsedSchemes.filter((scheme) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (scheme.metal !== selectedCategory) return false;
      }
      // Type filter
      if (selectedType === 'fixed') {
        if (scheme.type.toLowerCase() !== 'fixed') return false;
      } else if (selectedType === 'flexi') {
        if (scheme.type.toLowerCase() !== 'flexi') return false;
      }
      return true;
    });
  }, [parsedSchemes, selectedCategory, selectedType]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleComparePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (filteredSchemes.length < 2) {
      Alert.alert(
        'Compare Schemes',
        'Compare requires at least 2 active schemes in your current view.'
      );
      return;
    }
    const [s1, s2] = filteredSchemes;
    Alert.alert(
      'Quick Scheme Comparison',
      `1. ${s1.name} (${s1.type})\n   • Start From: ₹${s1.minAmount}\n   • Benefit: ${s1.bonusText}\n\n` +
      `2. ${s2.name} (${s2.type})\n   • Start From: ₹${s2.minAmount}\n   • Benefit: ${s2.bonusText}`,
      [
        { text: `Know more about ${s1.type}`, onPress: () => onKnowMore(s1) },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  const renderHeader = () => (
    <View style={styles.topContainer}>
      {/* Category Pills Bar */}
      <View style={styles.categoryPillsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory('all');
          }}
          style={[
            styles.categoryPill,
            selectedCategory === 'all' && styles.categoryPillActive,
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={14}
            color={selectedCategory === 'all' ? '#5A0011' : '#6B7280'}
          />
          <Text
            style={[
              styles.categoryPillText,
              selectedCategory === 'all' && styles.categoryPillTextActive,
            ]}
          >
            All Schemes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory('gold');
          }}
          style={[
            styles.categoryPill,
            selectedCategory === 'gold' && styles.categoryPillActive,
          ]}
        >
          <Ionicons
            name="sparkles"
            size={14}
            color={selectedCategory === 'gold' ? '#B45309' : '#6B7280'}
          />
          <Text
            style={[
              styles.categoryPillText,
              selectedCategory === 'gold' && styles.categoryPillTextActive,
            ]}
          >
            Gold Schemes
          </Text>
        </TouchableOpacity>

        {hasSilver && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory('silver');
            }}
            style={[
              styles.categoryPill,
              selectedCategory === 'silver' && styles.categoryPillActive,
            ]}
          >
            <Ionicons
              name="medal-outline"
              size={14}
              color={selectedCategory === 'silver' ? '#374151' : '#6B7280'}
            />
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'silver' && styles.categoryPillTextActive,
              ]}
            >
              Silver Schemes
            </Text>
          </TouchableOpacity>
        )}

        {hasDiamond && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory('diamond');
            }}
            style={[
              styles.categoryPill,
              selectedCategory === 'diamond' && styles.categoryPillActive,
            ]}
          >
            <Ionicons
              name="diamond-outline"
              size={14}
              color={selectedCategory === 'diamond' ? '#0E7490' : '#6B7280'}
            />
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === 'diamond' && styles.categoryPillTextActive,
              ]}
            >
              Diamond
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sub-filters Frequency/Type Pills */}
      <View style={styles.subFilterRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedType('all')}
          style={[
            styles.typePill,
            selectedType === 'all' && styles.typePillActive,
          ]}
        >
          <Ionicons
            name="grid"
            size={13}
            color={selectedType === 'all' ? '#FFF' : '#4B5563'}
          />
          <Text
            style={[
              styles.typePillText,
              selectedType === 'all' && styles.typePillTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedType('fixed')}
          style={[
            styles.typePill,
            selectedType === 'fixed' && styles.typePillActive,
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={13}
            color={selectedType === 'fixed' ? '#FFF' : '#4B5563'}
          />
          <Text
            style={[
              styles.typePillText,
              selectedType === 'fixed' && styles.typePillTextActive,
            ]}
          >
            Fixed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setSelectedType('flexi')}
          style={[
            styles.typePill,
            selectedType === 'flexi' && styles.typePillActive,
          ]}
        >
          <Ionicons
            name="infinite"
            size={13}
            color={selectedType === 'flexi' ? '#FFF' : '#4B5563'}
          />
          <Text
            style={[
              styles.typePillText,
              selectedType === 'flexi' && styles.typePillTextActive,
            ]}
          >
            Flexi
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Promo Banner matching Image 1 */}
      <View style={styles.heroPromoContainer}>
        <LinearGradient
          colors={['#FFFDF8', '#FFF6E0', '#FFEDC2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroPromoGradient}
        >
          <View style={styles.heroPromoLeft}>
            <Text style={styles.heroPromoTitle}>Small Savings{'\n'}Bigger Tomorrows</Text>
            <Text style={styles.heroPromoSubtitle}>
              Flexible gold schemes designed for your future.
            </Text>
          </View>

          <View style={styles.heroPromoRight}>
            <Image
              source={SCHEME_ASSETS.heroKalashBannerRight}
              style={styles.heroPromoKalashImage}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </View>

      {/* Counter and Sort Bar */}
      <View style={styles.counterSortRow}>
        <Text style={styles.schemesCountText}>
          {filteredSchemes.length} Scheme{filteredSchemes.length !== 1 ? 's' : ''} Available
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            setSortOrder((prev) =>
              prev === 'recommended' ? 'amount_asc' : prev === 'amount_asc' ? 'amount_desc' : 'recommended'
            );
          }}
          style={styles.sortButton}
        >
          <Text style={styles.sortButtonText}>
            Sort: {sortOrder === 'recommended' ? 'Recommended' : sortOrder === 'amount_asc' ? 'Min Amount ↑' : 'Min Amount ↓'}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#4B5563" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerContainer}>
      {/* Comparison Prompt Banner */}
      <View style={styles.compareCard}>
        <View style={styles.compareIconBubble}>
          <Ionicons name="scale-outline" size={22} color="#B45309" />
        </View>

        <View style={styles.compareTextCol}>
          <Text style={styles.compareTitle}>Not sure which scheme is right for you?</Text>
          <Text style={styles.compareSubtitle}>
            Compare schemes and choose what fits your goal.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleComparePress}
          style={styles.compareButton}
        >
          <Text style={styles.compareButtonText}>Compare »</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={isNested ? [] : ['top']}>
      {/* Screen Header - Only shown when NOT nested */}
      {!isNested && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#5A0011" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Join Schemes</Text>
            <Text style={styles.headerSubtitle}>Start your gold savings journey</Text>
          </View>

          <TouchableOpacity
            style={styles.headerHelpButton}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Gold Savings Help',
                'Choose between Flexible Weight schemes and Fixed Amount schemes to build physical gold at live market rates.'
              )
            }
          >
            <Ionicons name="help-circle-outline" size={24} color="#850111" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredSchemes}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SchemeCardV2
            scheme={item}
            onKnowMore={onKnowMore}
            onJoin={onJoinScheme}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={handleRefresh}
            colors={['#850111']}
            tintColor="#850111"
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FAF7F2',
  },
  headerBackButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#5A0011',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 1,
  },
  headerHelpButton: {
    padding: 6,
    borderRadius: 20,
  },
  listContent: {
    paddingBottom: 24,
  },
  topContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  categoryPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    gap: 5,
  },
  categoryPillActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryPillTextActive: {
    color: '#78350F',
    fontWeight: '800',
  },
  subFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 5,
  },
  typePillActive: {
    backgroundColor: '#5A0011',
    borderColor: '#5A0011',
  },
  typePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  typePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroPromoContainer: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 14,
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  heroPromoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 0,
    paddingVertical: 0,
    minHeight: 105,
    overflow: 'hidden',
  },
  heroPromoLeft: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 4,
    zIndex: 2,
  },
  heroPromoTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#850111',
    lineHeight: 21,
  },
  heroPromoSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 15,
  },
  heroPromoRight: {
    width: 175,
    height: 105,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  heroPromoKalashImage: {
    width: '100%',
    height: '100%',
  },
  counterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  schemesCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
  },
  footerContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  compareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  compareIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  compareTextCol: {
    flex: 1,
    paddingRight: 6,
  },
  compareTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  compareSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  compareButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#850111',
    backgroundColor: '#FFF',
  },
  compareButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#850111',
  },
});

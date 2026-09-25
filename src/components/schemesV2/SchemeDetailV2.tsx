import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  Linking,
  Share,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ParsedSchemeV2, SchemeDetailTab } from './types';
import { SCHEME_ASSETS, getSchemeCardImage } from './schemeAssets';
import { downloadAndShareSchemeBrochure } from '@/services/brochureService';

interface SchemeDetailV2Props {
  scheme: ParsedSchemeV2;
  onBack: () => void;
  onJoinScheme: (scheme: ParsedSchemeV2) => void;
  onDownloadBrochure?: (scheme: ParsedSchemeV2) => void;
  isNested?: boolean;
  language?: string;
}

const { width } = Dimensions.get('window');

export const SchemeDetailV2: React.FC<SchemeDetailV2Props> = ({
  scheme,
  onBack,
  onJoinScheme,
  onDownloadBrochure,
  isNested = false,
  language = 'en',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<SchemeDetailTab>('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);
  const [downloadingBrochure, setDownloadingBrochure] = useState(false);

  const { theme } = scheme;

  // Resolve dynamic colors based on this specific scheme's palette:
  const schemePrimaryColor = theme.gradientColors?.[1] || theme.gradientColors?.[0] || '#0B4730';
  const schemeDarkColor = theme.gradientColors?.[0] || schemePrimaryColor;
  const schemeTintColor = theme.badgeColor || '#F0FDF4';
  const schemeAccentColor = theme.accentColor || '#FDE047';
  const schemeActionGradient = [theme.gradientColors?.[1] || schemePrimaryColor, theme.gradientColors?.[0] || schemeDarkColor];

  const handleTabChange = (tab: SchemeDetailTab) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  };

  const handleDownload = async () => {
    if (onDownloadBrochure) {
      onDownloadBrochure(scheme);
      return;
    }
    setDownloadingBrochure(true);
    try {
      await downloadAndShareSchemeBrochure(scheme, language);
    } catch (err) {
      Alert.alert('Brochure', 'Unable to download brochure at this moment.');
    } finally {
      setDownloadingBrochure(false);
    }
  };

  const toggleFavorite = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsFavorite(!isFavorite);
  };

  const Container = isNested ? View : SafeAreaView;
  const containerProps = isNested
    ? { style: [styles.safeArea, { backgroundColor: '#FFFFFF' }] }
    : { style: styles.safeArea, edges: ['top' as const] };

  return (
    <Container {...(containerProps as any)}>
      {/* Top Header - Only shown when NOT nested, since nested container provides the single unified top header */}
      {!isNested && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={schemePrimaryColor} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: schemePrimaryColor }]}>Scheme Details</Text>

          <TouchableOpacity
            onPress={toggleFavorite}
            style={styles.favButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#E11D48' : schemePrimaryColor}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* Top Hero Banner Card matching Image 2 */}
        <View style={styles.heroCardContainer}>
          <LinearGradient
            colors={theme.gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Right side Jewelry Asset matching the scheme theme */}
            <View style={styles.detailBanglesWrapper} pointerEvents="none">
              <Image
                source={getSchemeCardImage(theme.assetType, scheme.rawScheme?.IMAGE)}
                style={styles.detailBanglesImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={[theme.gradientColors[0], 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.detailFadeOverlay}
              />
              <LinearGradient
                colors={[theme.gradientColors[0], 'transparent']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.detailTopFadeOverlay}
              />
            </View>

            <View style={styles.heroTopRow}>
              <View
                style={[
                  styles.heroBadge,
                  { backgroundColor: theme.badgeColor },
                ]}
              >
                <Text
                  style={[
                    styles.heroBadgeText,
                    { color: theme.badgeTextColor },
                  ]}
                >
                  {theme.badgeText}
                </Text>
              </View>
            </View>

            <View style={styles.heroLeftCol}>
              <Text style={styles.heroTitle}>{scheme.name.toUpperCase()}</Text>
              <Text style={[styles.heroSubtitle, { color: theme.accentColor }]}>
                Save in easy installments | Accumulate {theme.metalName} {scheme.savingType === 'weight' ? 'Weight' : 'Value'} | Start from just ₹{scheme.minAmount}
              </Text>
            </View>

            {/* 3 Circular Micro-Features */}
            <View style={styles.heroFeaturesRow}>
              {theme.features.map((feat, i) => (
                <View key={i} style={styles.heroFeatureItem}>
                  <View style={styles.heroIconCircle}>
                    <Ionicons
                      name={feat.icon as any}
                      size={14}
                      color={theme.accentColor}
                    />
                  </View>
                  <Text style={styles.heroFeatureLabel}>{feat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* Dynamic Horizontal Navigation Tabs */}
        <View style={styles.tabsRow}>
          {([
            { key: 'overview', label: 'Overview', icon: 'document-text-outline', visible: true },
            { key: 'benefits', label: 'Benefits', icon: 'diamond-outline', visible: scheme.keyBenefits && scheme.keyBenefits.length > 0 },
            { key: 'how_it_works', label: 'How it Works', icon: 'settings-outline', visible: scheme.howItWorksSteps && scheme.howItWorksSteps.length > 0 },
            { key: 'faqs', label: 'FAQs', icon: 'help-circle-outline', visible: scheme.faqs && scheme.faqs.length > 0 },
          ] as const)
            .filter((t) => t.visible)
            .map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => handleTabChange(tab.key as SchemeDetailTab)}
                  activeOpacity={0.8}
                  style={[
                    styles.tabButton,
                    isActive && [
                      styles.tabButtonActive,
                      { backgroundColor: schemeTintColor, borderColor: schemePrimaryColor },
                    ],
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={isActive ? schemePrimaryColor : '#6B7280'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive && { color: schemePrimaryColor, fontWeight: '800' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>

        {/* Tab 1: Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentArea}>
            {/* About the Scheme */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>About the Scheme</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            <View style={styles.aboutRow}>
              <Text style={styles.aboutParagraph}>{scheme.aboutParagraph}</Text>
              <View style={styles.aboutGoldBarsCardWrap}>
                <Image
                  source={scheme.metal === 'silver' ? SCHEME_ASSETS.aboutSilverBars : SCHEME_ASSETS.aboutGoldBars}
                  style={styles.aboutGoldBarsImage}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Key Metrics Grid (4 items) */}
            <View style={styles.metricsGrid}>
              {scheme.keyMetrics.map((metric, i) => (
                <View key={i} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: schemeTintColor }]}>
                    <Ionicons name={metric.icon as any} size={16} color={schemePrimaryColor} />
                  </View>
                  <Text style={styles.metricLabel}>{metric.label}</Text>
                  <Text style={styles.metricValue}>{metric.value}</Text>
                </View>
              ))}
            </View>

            {/* Backend Table Meta Breakdown (if available) */}
            {scheme.tableMeta && scheme.tableMeta.rows && scheme.tableMeta.rows.length > 0 && (
              <View style={styles.tableSectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>Scheme Plan Breakdown</Text>
                  <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
                </View>

                <View style={styles.tableRefinedContainer}>
                  {/* Table Header */}
                  <LinearGradient
                    colors={theme.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tableRefinedHeader}
                  >
                    {scheme.tableMeta.headers.map((h, idx) => (
                      <Text key={idx} style={[styles.tableRefinedHeaderText, { color: theme.accentColor }]}>
                        {h}
                      </Text>
                    ))}
                  </LinearGradient>

                  {/* Table Rows */}
                  {scheme.tableMeta.rows.map((row, rIndex) => (
                    <View
                      key={rIndex}
                      style={[
                        styles.tableRefinedRow,
                        rIndex % 2 !== 0 && styles.tableRowAlt,
                        rIndex === scheme.tableMeta!.rows.length - 1 && styles.tableRowLast,
                      ]}
                    >
                      {row.map((cell, cIndex) => (
                        <Text key={cIndex} style={styles.tableRefinedCell}>
                          {cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Day-Wise Incentive Bonus Slabs Breakdown (if available) */}
            {scheme.rawScheme?.is_interest_enabled && Array.isArray(scheme.rawScheme?.interest_slabs) && scheme.rawScheme.interest_slabs.length > 0 && (
              <View style={styles.tableSectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>
                    {language === 'ta' ? 'நாள்வாரி ஊக்கத்தொகை போனஸ்' : 'Day-wise Incentive Bonus'}
                  </Text>
                  <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
                </View>

                <View style={styles.tableRefinedContainer}>
                  <LinearGradient
                    colors={theme.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tableRefinedHeader}
                  >
                    <Text style={[styles.tableRefinedHeaderText, { color: theme.accentColor, flex: 1.2 }]}>
                      {language === 'ta' ? 'செலுத்தும் நாட்கள்' : 'Payment Days'}
                    </Text>
                    <Text style={[styles.tableRefinedHeaderText, { color: theme.accentColor, flex: 1 }]}>
                      {language === 'ta' ? 'கூடுதல் போனஸ்' : 'Bonus Rate'}
                    </Text>
                  </LinearGradient>

                  {scheme.rawScheme.interest_slabs.map((slab: any, sIndex: number) => (
                    <View
                      key={sIndex}
                      style={[
                        styles.tableRefinedRow,
                        sIndex % 2 !== 0 && styles.tableRowAlt,
                        sIndex === scheme.rawScheme.interest_slabs.length - 1 && styles.tableRowLast,
                      ]}
                    >
                      <Text style={[styles.tableRefinedCell, { flex: 1.2, fontWeight: '600' }]}>
                        {language === 'ta' ? `நாள் ${slab.from_day} முதல் ${slab.to_day} வரை` : `Day ${slab.from_day} – Day ${slab.to_day}`}
                      </Text>
                      <Text style={[styles.tableRefinedCell, { flex: 1, fontWeight: '700', color: '#166534' }]}>
                        +{slab.percentage}% {language === 'ta' ? 'போனஸ்' : 'Bonus'}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Key Benefits */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>Key Benefits</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            <View style={styles.benefitsGrid}>
              {scheme.keyBenefits.map((benefit, i) => (
                <View key={i} style={styles.benefitCard}>
                  <View style={[styles.benefitIconCircle, { backgroundColor: schemeTintColor }]}>
                    <Ionicons name={benefit.icon as any} size={20} color={schemePrimaryColor} />
                  </View>
                  <Text style={[styles.benefitTitle, { color: schemePrimaryColor }]}>{benefit.title}</Text>
                  <Text style={styles.benefitSubtitle}>{benefit.subtitle}</Text>
                </View>
              ))}
            </View>

            {/* Scheme Highlights */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>Scheme Highlights</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            <View style={styles.highlightsContainer}>
              <View style={styles.checklistColumn}>
                {scheme.schemeHighlights.map((hl, i) => (
                  <View key={i} style={styles.checkItem}>
                    <View style={[styles.checkCircle, { backgroundColor: schemePrimaryColor }]}>
                      <Ionicons name="checkmark" size={12} color="#FFF" />
                    </View>
                    <Text style={styles.checkText}>{hl}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.kalashEmblemWrap}>
                <Image
                  source={SCHEME_ASSETS.highlightsKalash}
                  style={styles.highlightsKalashImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Benefits Tab */}
        {activeTab === 'benefits' && (
          <View style={styles.tabContentArea}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>Detailed Scheme Benefits</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            {scheme.keyBenefits.map((b, idx) => (
              <View key={idx} style={styles.fullBenefitRow}>
                <View style={[styles.fullBenefitIcon, { backgroundColor: schemeTintColor }]}>
                  <Ionicons name={b.icon as any} size={22} color={schemePrimaryColor} />
                </View>
                <View style={styles.fullBenefitContent}>
                  <Text style={[styles.fullBenefitTitle, { color: schemePrimaryColor }]}>{b.title}</Text>
                  <Text style={styles.fullBenefitDesc}>{b.subtitle}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Tab 3: How it Works Tab */}
        {activeTab === 'how_it_works' && (
          <View style={styles.tabContentArea}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>How It Works</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            {scheme.howItWorksSteps.map((s, idx) => (
              <View key={idx} style={styles.stepCard}>
                <View style={[styles.stepBadge, { backgroundColor: schemeTintColor }]}>
                  <Text style={[styles.stepBadgeText, { color: schemePrimaryColor }]}>Step {s.step}</Text>
                </View>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tab 4: FAQs Tab */}
        {activeTab === 'faqs' && (
          <View style={styles.tabContentArea}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: schemePrimaryColor }]}>Frequently Asked Questions</Text>
              <View style={[styles.titleUnderline, { backgroundColor: schemeAccentColor }]} />
            </View>

            {scheme.faqs.map((faq, idx) => {
              const isOpen = expandedFaqIndex === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => setExpandedFaqIndex(isOpen ? null : idx)}
                  style={styles.faqItem}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQuestion, isOpen && { color: schemePrimaryColor }]}>{faq.question}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={isOpen ? schemePrimaryColor : '#9CA3AF'}
                    />
                  </View>
                  {isOpen && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.stickyBottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleDownload}
          disabled={downloadingBrochure}
          style={[
            styles.brochureButton,
            { borderColor: schemePrimaryColor },
            downloadingBrochure && { opacity: 0.7 },
          ]}
        >
          {downloadingBrochure ? (
            <ActivityIndicator size="small" color={schemePrimaryColor} style={{ marginRight: 6 }} />
          ) : (
            <Ionicons name="document-text-outline" size={18} color={schemePrimaryColor} />
          )}
          <Text style={[styles.brochureButtonText, { color: schemePrimaryColor }]}>
            {downloadingBrochure
              ? (language === 'ta' ? 'செயலாக்குகிறது...' : 'Processing...')
              : (language === 'ta' ? 'விவரக்குறிப்பு' : 'Brochure')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onJoinScheme(scheme);
          }}
          style={styles.joinButton}
        >
          <LinearGradient
            colors={schemeActionGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.joinGradient}
          >
            <Ionicons name="calendar-outline" size={17} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.joinButtonText}>Join This Scheme</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFF" style={{ marginLeft: 4 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Container>
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
    paddingVertical: 12,
    backgroundColor: '#FAF7F2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#5A0011',
    letterSpacing: 0.3,
  },
  favButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  scrollContent: {
    paddingTop: 12,
  },
  heroCardContainer: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  heroGradient: {
    padding: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  detailBanglesWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 52,
    width: width * 0.44,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  detailBanglesImage: {
    width: '100%',
    height: '100%',
  },
  detailFadeOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },
  detailTopFadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 18,
  },
  heroLeftCol: {
    maxWidth: '62%',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight: 23,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
  heroFeaturesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heroIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  heroFeatureLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FCECEF',
    borderWidth: 1,
    borderColor: '#F43F5E',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#850111',
    fontWeight: '800',
  },
  tabContentArea: {
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#850111',
    marginRight: 8,
  },
  titleUnderline: {
    width: 24,
    height: 2.5,
    backgroundColor: '#C59B27',
    borderRadius: 2,
  },
  aboutRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    alignItems: 'center',
  },
  aboutParagraph: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#4B5563',
    paddingRight: 10,
  },
  aboutGoldBarsCardWrap: {
    width: 105,
    height: 98,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutGoldBarsImage: {
    width: '100%',
    height: '100%',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    width: (width - 44) / 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 9.5,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
  },
  tableSectionWrap: {
    marginBottom: 20,
  },
  tableRefinedContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tableRefinedHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tableRefinedHeaderText: {
    fontSize: 11.5,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.2,
  },
  tableRefinedRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  tableRowAlt: {
    backgroundColor: '#F9FAFB',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableRefinedCell: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  benefitCard: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  benefitIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#850111',
    textAlign: 'center',
    marginBottom: 3,
  },
  benefitSubtitle: {
    fontSize: 10.5,
    color: '#6B7280',
    textAlign: 'center',
  },
  highlightsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    marginBottom: 20,
  },
  checklistColumn: {
    flex: 1,
    paddingRight: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#850111',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  kalashEmblemWrap: {
    width: 115,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  highlightsKalashImage: {
    width: '100%',
    height: '100%',
  },
  fullBenefitRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
    alignItems: 'center',
  },
  fullBenefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FCECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fullBenefitContent: {
    flex: 1,
  },
  fullBenefitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#850111',
  },
  fullBenefitDesc: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 2,
  },
  fullBenefitDetail: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 3,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCECEF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#850111',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 17,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111827',
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  brochureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#850111',
    backgroundColor: '#FFFFFF',
    flex: 0.45,
    marginRight: 10,
  },
  brochureButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#850111',
    marginLeft: 5,
  },
  joinButton: {
    flex: 0.55,
    borderRadius: 22,
    overflow: 'hidden',
  },
  joinGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});

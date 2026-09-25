import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ParsedSchemeV2 } from './types';
import { getSchemeCardImage } from './schemeAssets';

interface SchemeCardV2Props {
  scheme: ParsedSchemeV2;
  onKnowMore: (scheme: ParsedSchemeV2) => void;
  onJoin?: (scheme: ParsedSchemeV2) => void;
}

const { width } = Dimensions.get('window');

export const SchemeCardV2: React.FC<SchemeCardV2Props> = ({
  scheme,
  onKnowMore,
}) => {
  const { theme } = scheme;
  const cardImage = getSchemeCardImage(theme.assetType, scheme.rawScheme?.IMAGE);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onKnowMore(scheme);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={handlePress}
      style={[styles.cardContainer, { shadowColor: theme.cardGlow }]}
    >
      <LinearGradient
        colors={theme.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        {/* Right side Jewelry Asset Image matching reference image */}
        <View style={styles.cardImageWrapper} pointerEvents="none">
          <Image
            source={cardImage}
            style={styles.cardJewelryImage}
            resizeMode="cover"
          />
          {/* Subtle horizontal gradient feather to blend seamlessly into card */}
          <LinearGradient
            colors={[theme.gradientColors[0], 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.imageFadeOverlay}
          />
          {/* Subtle top edge blend to guarantee 100% seamless transition with card header */}
          <LinearGradient
            colors={[theme.gradientColors[0], 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.imageTopFadeOverlay}
          />
        </View>

        {/* Top Badges Row */}
        <View style={styles.topRow}>
          {/* Main Top Badge */}
          <View
            style={[
              styles.mainBadge,
              { backgroundColor: theme.badgeColor },
            ]}
          >
            <Text style={[styles.mainBadgeText, { color: theme.badgeTextColor }]}>
              {theme.badgeText}
            </Text>
          </View>

          {/* Optional Right Ribbon: EXTRA BONUS */}
          {theme.secondaryBadgeText && (
            <View style={styles.extraBonusBadge}>
              <Ionicons name="gift" size={13} color="#5C3800" />
              <Text style={styles.extraBonusText}>
                {theme.secondaryBadgeText}
              </Text>
            </View>
          )}
        </View>

        {/* Scheme Name and Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.schemeTitle} numberOfLines={2}>
            {scheme.name.toUpperCase()}
          </Text>
          <Text style={[styles.schemeSubtitle, { color: theme.accentColor }]}>
            {scheme.type} Payments | Save {scheme.savingType === 'weight' ? 'Weight' : 'Amount'} | Start ₹ {scheme.minAmount}
          </Text>
        </View>

        {/* Body Section with Micro-features */}
        <View style={styles.bodyRow}>
          <View style={styles.featuresList}>
            {theme.features.map((feat, idx) => (
              <View key={idx} style={styles.featureItem}>
                <View style={styles.featureIconBubble}>
                  <Ionicons
                    name={feat.icon as any}
                    size={12}
                    color={theme.accentColor}
                  />
                </View>
                <Text style={styles.featureLabel}>{feat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Chips & Know More CTA */}
        <View style={styles.bottomRow}>
          <View style={styles.chipsRow}>
            {/* Metal Chip */}
            <View style={styles.chip}>
              <Ionicons name="diamond-outline" size={11} color="#FFF" style={styles.chipIcon} />
              <Text style={styles.chipText}>{theme.metalName}</Text>
            </View>

            {/* Tenure Chip */}
            {Boolean(scheme.tenureText) && (
              <View style={styles.chip}>
                <Ionicons name="calendar-outline" size={11} color="#FFF" style={styles.chipIcon} />
                <Text style={styles.chipText}>{scheme.tenureText}</Text>
              </View>
            )}

            {/* Type Chip */}
            <View style={styles.chip}>
              <Ionicons
                name={scheme.type === 'Flexi' ? 'infinite' : 'checkmark-done'}
                size={11}
                color="#FFF"
                style={styles.chipIcon}
              />
              <Text style={styles.chipText}>{scheme.type}</Text>
            </View>
          </View>

          {/* Know More Pill Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            style={[styles.knowMoreButton, { backgroundColor: theme.buttonBackground }]}
          >
            <Text style={[styles.knowMoreText, { color: theme.buttonTextColor }]}>
              Know More
            </Text>
            <Ionicons name="arrow-forward" size={13} color={theme.buttonTextColor} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 9,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  gradientCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  extraBonusBadge: {
    backgroundColor: '#FFEBA0',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F7D070',
  },
  extraBonusText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#5C3800',
    textAlign: 'center',
    lineHeight: 10,
    marginTop: 2,
  },
  titleSection: {
    marginBottom: 10,
    maxWidth: '64%',
    zIndex: 2,
  },
  schemeTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    lineHeight: 21,
  },
  schemeSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  bodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuresList: {
    maxWidth: '60%',
    zIndex: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3.5,
  },
  featureIconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  featureLabel: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
  },
  cardImageWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 46,
    width: width * 0.44,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  cardJewelryImage: {
    width: '100%',
    height: '100%',
  },
  imageFadeOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 32,
  },
  imageTopFadeOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 18,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipIcon: {
    marginRight: 3,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  knowMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  knowMoreText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

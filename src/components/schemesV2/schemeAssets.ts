/**
 * Visual assets dictionary for Schemes V2 showcase.
 * Contains high-definition crops and renders matching the exact reference UI.
 */
export const SCHEME_ASSETS = {
  // Hero banner on Schemes screen
  bannerHero: require('../../../assets/images/schemes/banner_hero_original.png'),
  heroKalashBannerRight: require('../../../assets/images/schemes/hero_kalash_banner_right.png'),
  heroKalash: require('../../../assets/images/schemes/highlights_kalash_crop.png'),
  heroKalashHd: require('../../../assets/images/schemes/hero_kalash_hd.jpg'),

  // Scheme card right-side jewelry renders
  cardNecklace: require('../../../assets/images/schemes/card1_necklace_crop.png'),
  cardBullion: require('../../../assets/images/schemes/card2_bullion_crop.png'),
  cardSilverBullion: require('../../../assets/images/schemes/card_silver_bullion.png'),
  cardBangles: require('../../../assets/images/schemes/card_bangles_crop.png'),
  cardKalash: require('../../../assets/images/schemes/card_kalash_crop.png'),
  cardAmber: require('../../../assets/images/schemes/card_amber_crop.png'),
  cardNecklaceHd: require('../../../assets/images/schemes/card_necklace_hd.jpg'),
  cardBullionHd: require('../../../assets/images/schemes/card_bullion_hd.jpg'),

  // Scheme Detail screen assets
  detailBangles: require('../../../assets/images/schemes/detail_bangles_crop.png'),
  aboutGoldBars: require('../../../assets/images/schemes/about_gold_bars_card.png'),
  aboutSilverBars: require('../../../assets/images/schemes/about_silver_bars_card.png'),
  highlightsKalash: require('../../../assets/images/schemes/highlights_kalash_crop.png'),
};

/**
 * Helper to pick the appropriate card graphic based on scheme metal and type
 */
export function getSchemeCardImage(assetType: string, customImage?: string) {
  if (customImage && typeof customImage === 'string' && customImage.startsWith('http')) {
    return { uri: customImage };
  }
  switch (assetType) {
    case 'gold_bars':
      return SCHEME_ASSETS.cardBullion;
    case 'silver_bars':
      return SCHEME_ASSETS.cardSilverBullion;
    case 'bangles':
      return SCHEME_ASSETS.cardBangles;
    case 'kalash':
      return SCHEME_ASSETS.cardKalash;
    case 'amber_coins':
    case 'amber':
      return SCHEME_ASSETS.cardAmber;
    case 'diamond_ring':
      return SCHEME_ASSETS.cardNecklace;
    case 'necklace':
    default:
      return SCHEME_ASSETS.cardNecklace;
  }
}

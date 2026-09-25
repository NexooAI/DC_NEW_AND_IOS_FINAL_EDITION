import { ParsedSchemeV2, SchemeTheme, SchemeTableMeta } from './types';
import { themeConfig } from '@/constants/theme.config';

export const SCHEME_THEMES: Record<string, SchemeTheme> = {
  gold_flexi: {
    key: 'gold_flexi',
    gradientColors: ['#4A020B', '#7A0C1B', '#380007'],
    accentColor: '#F3CE72',
    badgeColor: '#FFEBA0',
    badgeTextColor: '#5C3800',
    badgeText: '★ POPULAR',
    badgeIcon: 'star',
    secondaryBadgeText: 'EXTRA\nBONUS',
    buttonBackground: '#F7D070',
    buttonTextColor: '#4A1500',
    cardGlow: 'rgba(122, 12, 27, 0.45)',
    metalName: 'Gold',
    assetType: 'necklace',
    features: [
      { icon: 'cash-outline', label: 'Flexible Payments' },
      { icon: 'bag-handle-outline', label: 'Save Gold Weight' },
      { icon: 'shield-checkmark-outline', label: 'Secure & Trusted' },
    ],
  },
  gold_fixed: {
    key: 'gold_fixed',
    gradientColors: ['#071938', '#112F66', '#050F24'],
    accentColor: '#E2B852',
    badgeColor: '#D0EBFF',
    badgeTextColor: '#0B4F8A',
    badgeText: '🛡️ MOST TRUSTED',
    badgeIcon: 'shield-checkmark',
    buttonBackground: '#F7D070',
    buttonTextColor: '#4A1500',
    cardGlow: 'rgba(17, 47, 102, 0.45)',
    metalName: 'Gold',
    assetType: 'gold_bars',
    features: [
      { icon: 'calendar-outline', label: 'Fixed Payments' },
      { icon: 'trending-up-outline', label: 'Assured Savings' },
      { icon: 'shield-outline', label: 'Trusted by Thousands' },
    ],
  },
  silver: {
    key: 'silver',
    gradientColors: ['#161E2E', '#253248', '#0F172A'],
    accentColor: '#E2E8F0',
    badgeColor: '#F1F5F9',
    badgeTextColor: '#1E293B',
    badgeText: '🥈 SILVER SAVER',
    badgeIcon: 'sparkles',
    secondaryBadgeText: 'PURE\nSILVER',
    buttonBackground: '#E2E8F0',
    buttonTextColor: '#0F172A',
    cardGlow: 'rgba(37, 50, 72, 0.45)',
    metalName: 'Silver',
    assetType: 'silver_bars',
    features: [
      { icon: 'cash-outline', label: 'Affordable Silver' },
      { icon: 'cube-outline', label: '999 Fine Pure Silver' },
      { icon: 'shield-checkmark-outline', label: 'Safe & Certified' },
    ],
  },
  gold_akshaya: {
    key: 'gold_akshaya',
    gradientColors: ['#042618', '#0B4730', '#021A10'],
    accentColor: '#FDE047',
    badgeColor: '#DCFCE7',
    badgeTextColor: '#166534',
    badgeText: '✨ AKSHAYA PROSPERITY',
    badgeIcon: 'sparkles',
    secondaryBadgeText: 'BONUS\nBENEFITS',
    buttonBackground: '#F7D070',
    buttonTextColor: '#143825',
    cardGlow: 'rgba(11, 71, 48, 0.45)',
    metalName: 'Gold',
    assetType: 'bangles',
    features: [
      { icon: 'gift-outline', label: 'Akshaya Bonus Weight' },
      { icon: 'sparkles-outline', label: 'Prosperity Growth' },
      { icon: 'shield-checkmark-outline', label: '100% Certified 22K Hallmark' },
    ],
  },
  gold_amethyst: {
    key: 'gold_amethyst',
    gradientColors: ['#2B083A', '#4A1261', '#1C0426'],
    accentColor: '#FDE047',
    badgeColor: '#F3E8FF',
    badgeTextColor: '#6B21A8',
    badgeText: '🌟 YOUVA SWARNA',
    badgeIcon: 'star',
    secondaryBadgeText: 'EXTRA\nWEIGHT',
    buttonBackground: '#F7D070',
    buttonTextColor: '#320645',
    cardGlow: 'rgba(74, 18, 97, 0.45)',
    metalName: 'Gold',
    assetType: 'kalash',
    features: [
      { icon: 'trending-up-outline', label: 'Weight Accumulation' },
      { icon: 'infinite-outline', label: 'Flexible Monthly Savings' },
      { icon: 'ribbon-outline', label: 'Youth Special Bonus' },
    ],
  },
  gold_amber: {
    key: 'gold_amber',
    gradientColors: ['#3B1408', '#5F2310', '#260C04'],
    accentColor: '#FBBF24',
    badgeColor: '#FEF3C7',
    badgeTextColor: '#92400E',
    badgeText: '🎁 10% EXTRA BONUS',
    badgeIcon: 'gift',
    secondaryBadgeText: 'EXTRA\n10% BONUS',
    buttonBackground: '#F59E0B',
    buttonTextColor: '#451A03',
    cardGlow: 'rgba(95, 35, 16, 0.45)',
    metalName: 'Gold',
    assetType: 'amber_coins',
    features: [
      { icon: 'gift-outline', label: '10% Extra Bonus' },
      { icon: 'cash-outline', label: 'Flexible Monthly Pay' },
      { icon: 'shield-checkmark-outline', label: 'Max Value Assurance' },
    ],
  },
  diamond: {
    key: 'diamond',
    gradientColors: ['#062A30', '#0F4D56', '#03171A'],
    accentColor: '#72E6F2',
    badgeColor: '#CFFAFE',
    badgeTextColor: '#0E7490',
    badgeText: '💎 SOLITAIRE CLUB',
    badgeIcon: 'diamond',
    buttonBackground: '#A5F3FC',
    buttonTextColor: '#083344',
    cardGlow: 'rgba(15, 77, 86, 0.45)',
    metalName: 'Diamond',
    assetType: 'diamond',
    features: [
      { icon: 'diamond-outline', label: 'Solitaire Value' },
      { icon: 'ribbon-outline', label: 'Certified Diamonds' },
      { icon: 'shield-checkmark-outline', label: 'VIP Privileges' },
    ],
  },
  old_gold: {
    key: 'old_gold',
    gradientColors: ['#361B0E', '#5B3019', '#241007'],
    accentColor: '#EAB308',
    badgeColor: '#FEF08A',
    badgeTextColor: '#713F12',
    badgeText: '♻️ BEST EXCHANGE',
    badgeIcon: 'repeat',
    buttonBackground: '#FDE047',
    buttonTextColor: '#451A03',
    cardGlow: 'rgba(91, 48, 25, 0.45)',
    metalName: 'Old Gold',
    assetType: 'antique',
    features: [
      { icon: 'repeat-outline', label: '100% Purity Value' },
      { icon: 'scale-outline', label: 'Zero Wastage Loss' },
      { icon: 'flash-outline', label: 'Instant New Jewelry' },
    ],
  },
};

/**
 * Extracts translated text safely from bilingual object or string
 */
export function getSchemeText(textObj: any, lang: string = 'en'): string {
  if (!textObj) return '';
  if (typeof textObj === 'string') return textObj.trim();
  if (typeof textObj === 'object') {
    return textObj[lang] || textObj.en || textObj.ta || '';
  }
  return String(textObj);
}

/**
 * Resolves the metal classification of a scheme
 */
export function resolveMetalType(scheme: any): 'gold' | 'silver' | 'diamond' | 'platinum' | 'old_gold' {
  const combined = (
    `${getSchemeText(scheme.SCHEMENAME)} ${getSchemeText(scheme.SLOGAN)} ${scheme.type || ''} ${scheme.SCHEMETYPE || ''} ${scheme.INS_TYPE || ''}`
  ).toLowerCase();

  if (combined.includes('old gold') || combined.includes('oldgold') || combined.includes('பழைய')) {
    return 'old_gold';
  }
  if (combined.includes('silver') || combined.includes('வெள்ளி') || combined.includes('వెండి')) {
    return 'silver';
  }
  if (combined.includes('diamond') || combined.includes('வைரம்') || combined.includes('वज्रं')) {
    return 'diamond';
  }
  if (combined.includes('platinum') || combined.includes('பிளாட்டினம்')) {
    return 'platinum';
  }
  return 'gold';
}

/**
 * Parses raw scheme data from API into a rich V2 presentation model
 */
export function parseSchemeV2(scheme: any, lang: string = 'en', schemeIndex: number = 0): ParsedSchemeV2 {
  const name = getSchemeText(scheme.SCHEMENAME, lang) || 'Gold Savings Scheme';
  const desc = getSchemeText(scheme.DESCRIPTION, lang);
  const slogan = getSchemeText(scheme.SLOGAN, lang) || 'A Precious Step Towards Your Future';
  const metal = resolveMetalType(scheme);
  const nameLower = name.toLowerCase();
  const sloganLower = slogan.toLowerCase();
  const combined = `${nameLower} ${sloganLower} ${(scheme.SCHEMETYPE || scheme.savingType || '').toLowerCase()}`;

  const schemeTypeRaw = (scheme.SCHEMETYPE || scheme.savingType || '').toLowerCase();
  const isFlexi =
    schemeTypeRaw.includes('flexi') ||
    schemeTypeRaw.includes('flexible') ||
    combined.includes('flexi') ||
    combined.includes('bonus') ||
    combined.includes('weight');

  // Select Theme with distinct luxury palette per scheme
  let theme: SchemeTheme;
  if (metal === 'silver') {
    theme = SCHEME_THEMES.silver;
  } else if (metal === 'diamond') {
    theme = SCHEME_THEMES.diamond;
  } else if (metal === 'old_gold') {
    theme = SCHEME_THEMES.old_gold;
  } else if (
    combined.includes('akshaya') ||
    combined.includes('ponmagal') ||
    combined.includes('அக்ஷய') ||
    combined.includes('பொன்மகள்')
  ) {
    theme = SCHEME_THEMES.gold_akshaya;
  } else if (
    combined.includes('youva') ||
    combined.includes('yuva') ||
    combined.includes('swarna') ||
    combined.includes('sarna') ||
    combined.includes('யோவ') ||
    combined.includes('சுவர்ண')
  ) {
    theme = SCHEME_THEMES.gold_amethyst;
  } else if (
    combined.includes('10%') ||
    combined.includes('ten percent') ||
    (combined.includes('bonus') && !combined.includes('digigold'))
  ) {
    theme = SCHEME_THEMES.gold_amber;
  } else if (!isFlexi) {
    theme = SCHEME_THEMES.gold_fixed;
  } else if (
    combined.includes('digigold') ||
    combined.includes('daily') ||
    combined.includes('weight')
  ) {
    theme = SCHEME_THEMES.gold_flexi;
  } else {
    // Dynamic luxury rotation for unclassified gold schemes to guarantee variety
    const goldThemeRotation = [
      SCHEME_THEMES.gold_flexi,
      SCHEME_THEMES.gold_fixed,
      SCHEME_THEMES.gold_akshaya,
      SCHEME_THEMES.gold_amethyst,
      SCHEME_THEMES.gold_amber,
    ];
    theme = goldThemeRotation[schemeIndex % goldThemeRotation.length];
  }

  // Min Amount detection
  let minAmount = 100;
  if (Array.isArray(scheme.chits) && scheme.chits.length > 0) {
    const amounts = scheme.chits
      .map((c: any) => Number(c.AMOUNT))
      .filter((a: number) => !isNaN(a) && a > 0);
    if (amounts.length > 0) {
      minAmount = Math.min(...amounts);
    }
  } else if (Array.isArray(scheme.relevantChits) && scheme.relevantChits.length > 0) {
    const amounts = scheme.relevantChits
      .map((c: any) => Number(c.AMOUNT))
      .filter((a: number) => !isNaN(a) && a > 0);
    if (amounts.length > 0) {
      minAmount = Math.min(...amounts);
    }
  } else if (scheme.fixed && !isNaN(Number(scheme.fixed))) {
    minAmount = Number(scheme.fixed);
  } else if (isFlexi) {
    minAmount = 100;
  } else {
    minAmount = 500;
  }

  // Tenure parsing: NEVER hardcode 11 months for flexible/open-ended schemes
  let tenureMonths: number | null = null;
  const rawMonths = scheme.duration_months ?? scheme.DURATION_MONTHS ?? scheme.durationMonths;
  if (rawMonths !== undefined && rawMonths !== null && !isNaN(Number(rawMonths)) && Number(rawMonths) > 0) {
    tenureMonths = Number(rawMonths);
  } else if (typeof scheme.DURATION === 'string') {
    const match = scheme.DURATION.match(/\d+/);
    if (match) {
      tenureMonths = parseInt(match[0], 10);
    }
  }

  let tenureText = '';
  if (scheme.tenure_text || scheme.TENURE_TEXT) {
    tenureText = getSchemeText(scheme.tenure_text || scheme.TENURE_TEXT, lang);
  } else if (tenureMonths) {
    tenureText = `${tenureMonths} Months`;
  } else if (isFlexi) {
    tenureText = 'Flexible';
  } else {
    tenureText = '';
  }

  // Metal-accurate purity and labels: Gold is strictly 22K (916 Hallmark) across all schemes
  let purity = '22K (916 Hallmark)';
  let metalLabel = 'Gold';
  if (metal === 'silver') {
    purity = '999 Fine Pure Silver';
    metalLabel = 'Silver';
  } else if (metal === 'diamond') {
    purity = 'VVS-EF Certified';
    metalLabel = 'Diamond';
  }

  // Bonus description
  let bonusText = '1 Month Bonus';
  if (theme.key === 'gold_amber') {
    bonusText = '10% Extra Bonus';
  } else if (theme.key === 'gold_akshaya') {
    bonusText = 'Akshaya Bonus';
  } else if (isFlexi) {
    bonusText = 'Extra Weight';
  }

  const jewellerName = themeConfig?.customerName || '';
  const jewellerNameTa = themeConfig?.customerName || '';

  // Metal and Type accurate About paragraph
  let defaultAbout = '';
  if (lang === 'ta') {
    if (metal === 'silver') {
      defaultAbout = isFlexi
        ? `இந்த ${name} தினசரி நேரடி வெள்ளி சந்தை விலையில் எளிய முறையில் வெள்ளி சேமிக்க உருவாக்கப்பட்டது. தூய 999 வெள்ளியாகச் சேமித்து ${jewellerNameTa ? `${jewellerNameTa}-ல் ` : ''}வெள்ளிப் பொருட்கள், நாணயங்கள் அல்லது ஆபரணங்களாகப் பெற்றுக்கொள்ளலாம்.`
        : `இந்த ${name} ஒரு ஒழுங்கமைக்கப்பட்ட மாதாந்திர வெள்ளி சேமிப்புத் திட்டம்.${tenureMonths ? ` ${tenureMonths} மாதங்கள் தவணை செலுத்தி,` : ''} ${jewellerNameTa ? `${jewellerNameTa} வழங்கும் ` : ''}சிறப்பு போனஸுடன் தூய 999 வெள்ளிப் பொருட்கள் அல்லது ஆபரணங்களாகப் பெறலாம்.`;
    } else if (metal === 'diamond') {
      defaultAbout = `இந்த ${name} வைர நகை விரும்பிகளுக்கான பிரத்யேக சேமிப்புத் திட்டம். சான்றளிக்கப்பட்ட வைர நகைகள் மற்றும் பிரைடல் நகைகளை விஐபி சலுகைகளுடன் சேமித்துப் பெறலாம்.`;
    } else if (isFlexi) {
      defaultAbout = `இந்த ${name} உங்கள் வசதிக்கேற்ப எப்போது வேண்டுமானாலும் சேமிக்கக்கூடிய நெகிழ்வான தங்கச் சேமிப்புத் திட்டம். நேரடி சந்தை விலையில் தூய 22K தங்க எடையைச் சேமித்து ${jewellerNameTa ? `${jewellerNameTa} வழங்கும் ` : ''}போனஸ் எடையுடன் நகைகளாகப் பெறலாம்.`;
    } else {
      defaultAbout = `இந்த ${name} ஒரு ஒழுங்கமைக்கப்பட்ட மாதாந்திர தங்கச் சேமிப்புத் திட்டம்.${tenureMonths ? ` ${tenureMonths} மாதங்கள் சேமித்து,` : ''} ${jewellerNameTa ? `${jewellerNameTa} வழங்கும் ` : ''}1 மாத போனஸுடன் 100% BIS 916 ஹால்மார்க் நகைகளாகப் பெற்றுக்கொள்ளலாம்.`;
    }
  } else {
    if (metal === 'silver') {
      defaultAbout = isFlexi
        ? `The ${name} is designed for smart and flexible silver savings. Invest at transparent daily silver rates, accumulate pure 999 silver weight in grams, and redeem for genuine silver articles, coins, or jewellery.`
        : `The ${name} is a disciplined monthly silver savings plan.${tenureMonths ? ` Pay a fixed installment for ${tenureMonths} months and receive` : ' Receive'} an exclusive jeweller bonus to purchase pure 999 silver articles or sterling jewellery.`;
    } else if (metal === 'diamond') {
      defaultAbout = `The ${name} is an exclusive privilege savings program for diamond lovers. Accumulate value towards certified natural diamond solitaires and bridal jewellery with VIP benefits.`;
    } else if (theme.key === 'gold_amber') {
      defaultAbout = `The ${name} delivers maximum value with an extraordinary 10% Extra Promotional Bonus.${tenureMonths ? ` Accumulate your savings over ${tenureMonths} months and enjoy` : ' Enjoy'} our highest bonus contribution when purchasing pure hallmarked jewellery.`;
    } else if (theme.key === 'gold_akshaya') {
      defaultAbout = `The ${name} is an auspicious prosperity savings plan tailored for weddings, celebrations, and festive jewellery purchases. Save systematically and enjoy special Akshaya bonus benefits with zero making charge privileges.`;
    } else if (theme.key === 'gold_amethyst') {
      defaultAbout = `The ${name} is designed for youth and smart investors to build gold wealth effortlessly. Save in small, comfortable amounts, accumulate pure gold weight daily, and receive an exclusive Youva bonus upon completion.`;
    } else if (isFlexi) {
      defaultAbout = `The ${name} gives you the freedom to save at your own pace. Deposit flexible amounts whenever you wish, convert instantly to pure gold weight at live market rates, and earn bonus gold weight on completion.`;
    } else {
      defaultAbout = `The ${name} is a disciplined fixed-installment gold accumulation plan.${tenureMonths ? ` Pay your chosen installment for ${tenureMonths} months, and` : ' And'} ${jewellerName ? `${jewellerName} contributes ` : ''}a full 1-month bonus towards your hallmarked jewelry purchase.`;
    }
  }

  const aboutParagraph = desc && desc.length > 25 ? desc : defaultAbout;

  // Key Metrics
  const metricStartLabel = isFlexi ? (lang === 'ta' ? 'குறைந்தபட்சம்' : 'Start From') : (lang === 'ta' ? 'மாதாந்திர தவணை' : 'Monthly Fixed');
  const metricMetalLabel = `${metalLabel} ${lang === 'ta' ? 'தூய்மை' : 'Purity'}`;
  const keyMetrics: Array<{ label: string; value: string; icon: string }> = [
    { label: metricStartLabel, value: `₹ ${minAmount}`, icon: isFlexi ? 'cash-outline' : 'calendar-outline' },
  ];

  if (tenureText) {
    keyMetrics.push({ label: lang === 'ta' ? 'கால அளவு' : 'Tenure', value: tenureText, icon: 'hourglass-outline' });
  }

  keyMetrics.push(
    { label: metricMetalLabel, value: purity, icon: metal === 'diamond' ? 'diamond-outline' : 'scale-outline' },
    { label: lang === 'ta' ? 'போனஸ் நன்மை' : 'Bonus Benefit', value: bonusText, icon: 'gift-outline' }
  );

  // Key Benefits - check API first
  let keyBenefits: Array<{ title: string; subtitle: string; icon: string }> = [];
  const rawBenefits = scheme.BENEFITS || scheme.benefits || (Array.isArray(scheme.meta_data) && scheme.meta_data[0]?.benefits);
  if (Array.isArray(rawBenefits) && rawBenefits.length > 0) {
    keyBenefits = rawBenefits.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return {
          title: item,
          subtitle: jewellerName ? `${jewellerName} Scheme Privilege` : 'Scheme Privilege',
          icon: idx === 0 ? 'sparkles-outline' : idx === 1 ? 'gift-outline' : idx === 2 ? 'shield-checkmark-outline' : 'ribbon-outline',
        };
      }
      return {
        title: getSchemeText(item.title || item.TITLE || item.name, lang) || `Benefit ${idx + 1}`,
        subtitle: getSchemeText(item.subtitle || item.SUBTITLE || item.desc || item.description, lang) || '',
        icon: item.icon || (idx === 0 ? 'sparkles-outline' : idx === 1 ? 'gift-outline' : idx === 2 ? 'shield-checkmark-outline' : 'ribbon-outline'),
      };
    });
  } else if (metal === 'silver') {
    keyBenefits = [
      {
        title: isFlexi
          ? (lang === 'ta' ? 'தினசரி நேரடி வெள்ளி விலை' : 'Live Daily Silver Rates')
          : (lang === 'ta' ? 'மாதாந்திர நிலையான வெள்ளித் திட்டம்' : 'Fixed Monthly Silver Plan'),
        subtitle: isFlexi
          ? (lang === 'ta' ? `ரூ.${minAmount} முதல் தினசரி நேரடி விலை` : `Transparent daily market pricing from ₹${minAmount}`)
          : (lang === 'ta' ? `மாதம் ரூ.${minAmount} நிலையான தவணை` : `Fixed installments from ₹${minAmount}`),
        icon: isFlexi ? 'trending-up-outline' : 'calendar-outline',
      },
      {
        title: isFlexi
          ? (lang === 'ta' ? 'வெள்ளி எடை சேமிப்பு' : 'Accumulate Silver Grams')
          : (lang === 'ta' ? 'முதிர்வு போனஸ் சலுகை' : 'Exclusive Maturity Bonus'),
        subtitle: isFlexi
          ? (lang === 'ta' ? 'சேமிப்பை நேரடியாக தூய வெள்ளியாக மாற்றலாம்' : 'Convert savings directly into physical silver')
          : (lang === 'ta' ? (jewellerNameTa ? `${jewellerNameTa} வழங்கும் சிறப்பு போனஸ்` : 'சிறப்பு போனஸ் சலுகை') : (jewellerName ? `${jewellerName} adds a special bonus installment` : 'Special bonus installment added')),
        icon: isFlexi ? 'cube-outline' : 'gift-outline',
      },
      {
        title: lang === 'ta' ? 'செய்கூலி, சேதார சலுகைகள்' : 'Zero Wastage Benefits',
        subtitle: lang === 'ta' ? 'முதிர்வில் சிறப்பு தள்ளுபடி சலுகைகள்' : 'Special discounts on making charges',
        icon: 'sparkles-outline',
      },
      {
        title: lang === 'ta' ? '100% தூய 999 வெள்ளி' : '100% Certified 999 Silver',
        subtitle: lang === 'ta' ? 'முழுமையான சான்றளிக்கப்பட்ட தூய்மை' : 'Guaranteed purity on redemption',
        icon: 'shield-checkmark-outline',
      },
    ];
  } else if (metal === 'diamond') {
    keyBenefits = [
      { title: 'Solitaire Privilege Plan', subtitle: 'Save towards certified natural diamonds', icon: 'diamond-outline' },
      { title: 'Exclusive Diamond Bonus', subtitle: 'Special promotional bonus on diamond jewellery', icon: 'gift-outline' },
      { title: 'Certified Authenticity', subtitle: '100% IGI / GIA certified diamonds', icon: 'ribbon-outline' },
      { title: 'VIP Customer Privileges', subtitle: 'Priority previews and custom jewellery crafting', icon: 'star-outline' },
    ];
  } else if (theme.key === 'gold_amber') {
    keyBenefits = [
      { title: '10% Extra Bonus Value', subtitle: 'One of our highest bonus contribution plans', icon: 'gift-outline' },
      { title: 'Flexible Monthly Payments', subtitle: `Start easily from ₹${minAmount}`, icon: 'cash-outline' },
      { title: 'Full Hallmark Assurance', subtitle: 'Redeem for 100% BIS 916 hallmarked jewelry', icon: 'ribbon-outline' },
      { title: 'Maximum Savings Return', subtitle: 'Get significantly more gold for your money', icon: 'trending-up-outline' },
    ];
  } else if (theme.key === 'gold_akshaya') {
    keyBenefits = [
      { title: 'Auspicious Bridal Savings', subtitle: 'Tailored for weddings and family celebrations', icon: 'heart-outline' },
      { title: 'Akshaya Special Bonus', subtitle: 'Complimentary bonus added on scheme maturity', icon: 'gift-outline' },
      { title: 'Zero Wastage Privileges', subtitle: 'Special concessions on making charges', icon: 'sparkles-outline' },
      { title: '100% BIS 916 Hallmark', subtitle: 'Guaranteed certified gold purity', icon: 'shield-checkmark-outline' },
    ];
  } else if (theme.key === 'gold_amethyst') {
    keyBenefits = [
      { title: 'Micro-Savings for Youth', subtitle: `Start with flexible amounts from ₹${minAmount}`, icon: 'wallet-outline' },
      { title: 'Daily Gold Weight Accrual', subtitle: 'Turn regular savings into pure physical gold', icon: 'trending-up-outline' },
      { title: 'Youva Special Weight Bonus', subtitle: 'Extra gold weight credited on maturity', icon: 'ribbon-outline' },
      { title: 'Digital & Hassle-Free', subtitle: 'Track your grams and pay via UPI anytime', icon: 'phone-portrait-outline' },
    ];
  } else if (isFlexi) {
    keyBenefits = [
      {
        title: lang === 'ta' ? 'நேரடி தங்க விலை பதிவு' : 'Live Gold Rate Booking',
        subtitle: lang === 'ta' ? `ரூ.${minAmount} முதல் எப்போது வேண்டுமானாலும் சேமிக்கலாம்` : `Pay any amount from ₹${minAmount} anytime`,
        icon: 'trending-up-outline',
      },
      {
        title: lang === 'ta' ? 'கூடுதல் தங்க எடை போனஸ்' : 'Extra Gold Weight Bonus',
        subtitle: lang === 'ta' ? `${jewellerNameTa} வழங்கும் கூடுதல் தங்க எடை` : `${jewellerName} adds promotional bonus gold weight`,
        icon: 'gift-outline',
      },
      {
        title: lang === 'ta' ? 'செய்கூலி, சேதாரம் சலுகை' : 'Zero Wastage Privileges',
        subtitle: lang === 'ta' ? 'நகைகள் வாங்கும் போது சிறப்பு தள்ளுபடிகள்' : 'Special discounts on making and wastage charges',
        icon: 'sparkles-outline',
      },
      {
        title: lang === 'ta' ? '100% BIS 916 ஹால்மார்க் தங்கம்' : '100% BIS 916 Hallmarked Gold',
        subtitle: lang === 'ta' ? 'முழுமையான பாதுகாப்பு மற்றும் தூய்மை' : 'Allocated pure gold safely insured in vault',
        icon: 'shield-checkmark-outline',
      },
    ];
  } else {
    keyBenefits = [
      {
        title: lang === 'ta' ? 'நிலையான ஒழுங்கான சேமிப்பு' : 'Fixed Disciplined Savings',
        subtitle: lang === 'ta' ? `மாதம் ரூ.${minAmount} முதல் எளிய தவணை` : `Select an affordable installment from ₹${minAmount}`,
        icon: 'calendar-outline',
      },
      {
        title: lang === 'ta' ? '1 மாத போனஸ் எங்கள் பங்களிப்பு' : '1 Month Bonus Paid by Us',
        subtitle: lang === 'ta' ? `${jewellerNameTa} வழங்கும் இலவச போனஸ் தவணை` : `${jewellerName} pays the bonus installment`,
        icon: 'gift-outline',
      },
      {
        title: lang === 'ta' ? 'செய்கூலி, சேதாரம் பாதுகாப்பு' : 'Zero Wastage Protection',
        subtitle: lang === 'ta' ? 'முதிர்வில் சிறப்பு தள்ளுபடி சலுகைகள்' : 'Enjoy special discounts on making and wastage charges',
        icon: 'sparkles-outline',
      },
      {
        title: lang === 'ta' ? '100% BIS 916 ஹால்மார்க் நகைகள்' : 'Guaranteed Maturity Value',
        subtitle: lang === 'ta' ? 'முழு மதிப்பிற்கும் தூய நகைகளாக மாற்றலாம்' : '100% assured return for hallmarked jewelry purchase',
        icon: 'shield-checkmark-outline',
      },
    ];
  }

  // Scheme Highlights
  let schemeHighlights: string[] = [];
  if (lang === 'ta') {
    if (metal === 'silver') {
      schemeHighlights = [
        isFlexi ? 'தினசரி நேரடி சந்தை விலையில் வெள்ளி எடை சேமிப்பு' : `ஒழுங்கமைக்கப்பட்ட மாதாந்திர தவணைகள்${tenureMonths ? ` (${tenureMonths} மாதங்கள்)` : ''}`,
        '100% தூய 999 சான்றளிக்கப்பட்ட வெள்ளி உத்தரவாதம்',
        isFlexi ? 'முதிர்வில் கூடுதல் வெள்ளி எடை போனஸ்' : `${jewellerNameTa} வழங்கும் இலவச போனஸ் தவணை`,
        'தூய வெள்ளி நாணயங்கள், பூஜை பொருட்கள் அல்லது நகைகளாக மாற்றலாம்',
        'உடனடி டிஜிட்டல் ரசீதுகள் மற்றும் எளிய மொபைல் கட்டணங்கள்',
      ];
    } else if (metal === 'diamond') {
      schemeHighlights = [
        `மாதாந்திர வைர சேமிப்புத் திட்டம்${tenureMonths ? ` (${tenureMonths} மாதங்கள்)` : ''}`,
        '100% IGI / GIA சான்றளிக்கப்பட்ட இயற்கை வைரங்கள்',
        'வைர நகைகள் வாங்கும்போது பிரத்யேக விஐபி போனஸ்',
        'தேர்ந்தெடுக்கப்பட்ட வைர நகைகளுக்கு செய்கூலி சலுகை',
        'விஐபி ஷோரூம் பிரத்யேக வடிவமைப்பு சேவை',
      ];
    } else if (isFlexi) {
      schemeHighlights = [
        `ரூ.${minAmount} முதல் உங்கள் விருப்பப்படி எப்போது வேண்டுமானாலும் சேமிக்கலாம்`,
        'நேரடி தங்க விலையில் உடனடி 22K தங்க எடை வரவு',
        'முதிர்வில் கூடுதல் தங்க எடை போனஸ்',
        '100% BIS 916 ஹால்மார்க் நகைகள் அல்லது தங்க நாணயங்களாக மாற்றலாம்',
        'பாதுகாப்பான காப்பீட்டுடன் கூடிய பெட்டகப் பாதுகாப்பு',
      ];
    } else {
      schemeHighlights = [
        `ஒழுங்கான மாதாந்திர நிலையான தவணைகள்${tenureMonths ? ` (${tenureMonths} மாதங்கள்)` : ''}`,
        `${jewellerNameTa} வழங்கும் 1 மாத போனஸ் பங்களிப்பு`,
        'செய்கூலி மற்றும் சேதாரத்தில் சிறப்பு தள்ளுபடி சலுகைகள்',
        '100% BIS 916 ஹால்மார்க் தங்க நகைகளாக மாற்றலாம்',
        'ஆயிரக்கணக்கான குடும்பங்களின் அசைக்க முடியாத நம்பிக்கை',
      ];
    }
  } else {
    if (metal === 'silver') {
      schemeHighlights = [
        isFlexi ? 'Save silver at live transparent daily rates' : `Fixed monthly installments${tenureMonths ? ` for ${tenureMonths} months` : ''}`,
        '100% BIS hallmarked 999 pure silver guarantee',
        isFlexi ? 'Earn promotional extra silver weight bonus' : 'Complimentary jeweller bonus on maturity',
        'Redeem for pure silver coins, pooja articles, or jewellery',
        'Instant digital receipts with secure app payments',
      ];
    } else if (metal === 'diamond') {
      schemeHighlights = [
        `Fixed monthly solitaire accumulation${tenureMonths ? ` for ${tenureMonths} months` : ''}`,
        '100% IGI / GIA natural certified diamonds',
        'Exclusive VIP bonus added towards jewellery redemption',
        'Zero wastage benefits on diamond jewellery selection',
        'Priority VIP showroom preview and bespoke design consultation',
      ];
    } else if (isFlexi) {
      schemeHighlights = [
        `Deposit flexible amounts anytime starting from ₹${minAmount}`,
        'Instant conversion to 22K gold weight at live rates',
        'Promotional extra gold weight credited on maturity',
        'Redeem for any hallmarked gold ornaments or coins',
        'Allocated physical gold securely held in insured custody',
      ];
    } else {
      schemeHighlights = [
        `Disciplined fixed monthly installments${tenureMonths ? ` for ${tenureMonths} months` : ''}`,
        `${jewellerName} contributes a bonus installment`,
        'Zero wastage and making charge discounts on selected jewellery',
        'Redeem 100% value for BIS 916 hallmarked pure gold jewellery',
        'Trusted by thousands of happy families across Tamil Nadu',
      ];
    }
  }

  // How It Works Steps - check API first
  let howItWorksSteps: Array<{ step: number; title: string; desc: string }> = [];
  const rawHowItWorks = scheme.how_it_works || scheme.howItWorksSteps || scheme.JOININGPROCEDURE || (Array.isArray(scheme.meta_data) && scheme.meta_data[0]?.how_it_works);
  if (Array.isArray(rawHowItWorks) && rawHowItWorks.length > 0) {
    howItWorksSteps = rawHowItWorks.map((item: any, idx: number) => {
      if (typeof item === 'string') {
        return {
          step: idx + 1,
          title: `Step ${idx + 1}`,
          desc: item,
        };
      }
      return {
        step: item.step || idx + 1,
        title: getSchemeText(item.title, lang) || `Step ${idx + 1}`,
        desc: getSchemeText(item.desc || item.description, lang) || '',
      };
    });
  } else if (lang === 'ta') {
    if (metal === 'silver') {
      howItWorksSteps = [
        {
          step: 1,
          title: isFlexi ? 'சேமிப்புத் தொகையைத் தேர்வு செய்க' : 'மாதாந்திர தவணையைத் தேர்வு செய்க',
          desc: `உங்கள் வெள்ளிச் சேமிப்பை ரூ.${minAmount} முதல் எளிதாகத் தொடங்கலாம்.`,
        },
        {
          step: 2,
          title: isFlexi ? 'வெள்ளி எடையைச் சேமிக்க' : `தவணை செலுத்துக${tenureMonths ? ` (${tenureMonths} மாதங்கள்)` : ''}`,
          desc: isFlexi
            ? 'ஒவ்வொரு கட்டணமும் அன்றைய நேரடி சந்தை விலையில் தூய 999 வெள்ளி எடையாக வரவு வைக்கப்படும்.'
            : 'யுபிஐ, கார்டு அல்லது நெட்பேங்கிங் மூலம் சுலபமாக மாதத் தவணையைச் செலுத்தலாம்.',
        },
        {
          step: 3,
          title: 'போனஸ் நன்மைகளைப் பெறுக',
          desc: isFlexi
            ? `${jewellerNameTa} முதிர்வில் கூடுதல் போனஸ் வெள்ளி எடையை வழங்குகிறது.`
            : `${jewellerNameTa} வழங்கும் பிரத்யேக போனஸ் தவணை உங்கள் கணக்கில் சேரும்.`,
        },
        {
          step: 4,
          title: 'தூய வெள்ளியாகப் பெறுக',
          desc: 'நமது கிளைகளில் தூய வெள்ளி நாணயங்கள், பாத்திரங்கள் அல்லது வெள்ளி நகைகளாகப் பெற்றுக்கொள்ளலாம்.',
        },
      ];
    } else if (isFlexi) {
      howItWorksSteps = [
        {
          step: 1,
          title: 'நெகிழ்வான தொகையைச் செலுத்துக',
          desc: `ரூ.${minAmount} முதல் உங்கள் வசதிக்கேற்ப எப்போது வேண்டுமானாலும் சேமிக்கலாம்.`,
        },
        {
          step: 2,
          title: 'நேரடி தங்க விலையில் எடையைப் பதிவு செய்க',
          desc: 'நீங்கள் செலுத்தும் தொகை உடனடி நேரடி விலையில் 22K தங்க எடையாக வரவு வைக்கப்படும்.',
        },
        {
          step: 3,
          title: 'கூடுதல் தங்க எடை போனஸ் பெறுக',
          desc: `${jewellerNameTa} திட்ட முதிர்வில் கூடுதல் சிறப்பு தங்க எடை போனஸை வழங்குகிறது.`,
        },
        {
          step: 4,
          title: 'ஹால்மார்க் நகைகளாகப் பெறுக',
          desc: 'சேமித்த முழு தங்க எடைக்கு இணையான BIS 916 ஹால்மார்க் நகைகளாகப் பெற்றுக்கொள்ளலாம்.',
        },
      ];
    } else {
      howItWorksSteps = [
        {
          step: 1,
          title: 'மாதாந்திரத் தவணையைத் தேர்வு செய்க',
          desc: `ரூ.${minAmount} முதல் உங்கள் பட்ஜெட்டுக்கு ஏற்ற மாதாந்திரத் தவணையைத் தேர்ந்தெடுக்கவும்.`,
        },
        {
          step: 2,
          title: `தவணை செலுத்துக${tenureMonths ? ` (${tenureMonths} மாதங்கள்)` : ''}`,
          desc: 'ஜிபே, போன்பே அல்லது யுபிஐ மூலம் மாதாமாதம் குறிப்பிட்ட தேதியில் எளிதாகச் செலுத்தலாம்.',
        },
        {
          step: 3,
          title: `${jewellerNameTa} போனஸ் நன்மை`,
          desc: 'திட்டத்தின் முடிவில் எங்கள் சார்பாக 1 மாத இலவச போனஸ் தவணை வழங்கப்படும்.',
        },
        {
          step: 4,
          title: 'அழகிய நகைகளாகப் பெறுக',
          desc: 'செய்கூலி மற்றும் சேதாரச் சலுகைகளுடன் 100% தூய BIS 916 ஹால்மார்க் நகைகளாகப் பெற்றுக்கொள்ளலாம்.',
        },
      ];
    }
  } else if (metal === 'silver') {
    howItWorksSteps = [
      {
        step: 1,
        title: isFlexi ? 'Choose Savings Amount' : 'Select Monthly Installment',
        desc: `Start your silver savings with as little as ₹${minAmount}.`,
      },
      {
        step: 2,
        title: isFlexi ? 'Accumulate Silver Grams' : `Pay Regularly${tenureMonths ? ` for ${tenureMonths} Months` : ''}`,
        desc: isFlexi
          ? 'Each payment converts into pure silver weight based on that day’s live market rate.'
          : 'Pay your fixed monthly installment conveniently via UPI, Card, or NetBanking.',
      },
      {
        step: 3,
        title: 'Receive Maturity Bonus',
        desc: isFlexi
          ? `${jewellerName} credits extra promotional silver weight on completion.`
          : `We contribute an exclusive bonus installment to your silver account.`,
      },
      {
        step: 4,
        title: 'Redeem Pure Silver',
        desc: 'Visit our showroom to purchase pure silver articles, coins, or 925 sterling silver jewellery.',
      },
    ];
  } else if (isFlexi) {
    howItWorksSteps = [
      {
        step: 1,
        title: 'Deposit Flexible Amount',
        desc: `Pay any flexible amount starting from ₹${minAmount} whenever convenient.`,
      },
      {
        step: 2,
        title: 'Lock In Live Gold Rate',
        desc: 'Your payment is immediately converted to gold grams at the prevailing market gold rate.',
      },
      {
        step: 3,
        title: 'Earn Extra Weight Bonus',
        desc: `${jewellerName} adds promotional bonus gold grams upon completing the plan tenure.`,
      },
      {
        step: 4,
        title: 'Redeem Hallmark Gold',
        desc: 'Take home pure BIS 916 hallmarked gold jewellery matching your accumulated weight.',
      },
    ];
  } else {
    howItWorksSteps = [
      {
        step: 1,
        title: 'Choose Fixed Monthly Installment',
        desc: `Pick an installment that fits your budget starting from ₹${minAmount} per month.`,
      },
      {
        step: 2,
        title: `Pay Regularly${tenureMonths ? ` for ${tenureMonths} Months` : ''}`,
        desc: 'Make regular monthly payments via UPI, Google Pay, PhonePe, or Cards.',
      },
      {
        step: 3,
        title: `${jewellerName} Bonus Benefit`,
        desc: 'We contribute the bonus installment into your savings fund.',
      },
      {
        step: 4,
        title: 'Redeem for Exquisite Jewellery',
        desc: 'Redeem your full value for 100% BIS hallmarked gold jewelry with special making charge benefits.',
      },
    ];
  }

  // FAQs - check API first
  let faqs: Array<{ question: string; answer: string }> = [];
  const rawFaqs = scheme.faqs || scheme.FAQS || (Array.isArray(scheme.meta_data) && scheme.meta_data[0]?.faqs);
  if (Array.isArray(rawFaqs) && rawFaqs.length > 0) {
    faqs = rawFaqs.map((f: any) => ({
      question: getSchemeText(f.question || f.q, lang),
      answer: getSchemeText(f.answer || f.a, lang),
    }));
  } else if (lang === 'ta') {
    if (metal === 'silver') {
      faqs = [
        {
          question: 'வெள்ளிச் சேமிப்பின் மதிப்பு எவ்வாறு கணக்கிடப்படுகிறது?',
          answer: isFlexi
            ? 'நீங்கள் செலுத்தும் தொகை, செலுத்திய நாள் மற்றும் நேரத்தின் நேரடி வெள்ளி சந்தை விலையின்படி 999 தூய வெள்ளி கிராம்களாக மாற்றப்படுகிறது.'
            : `நீங்கள் மாதாந்திர நிலையான தவணையை${tenureMonths ? ` ${tenureMonths} மாதங்கள்` : ''} செலுத்துகிறீர்கள், மேலும் ${jewellerNameTa} முதிர்வு போனஸ் தவணையை வழங்குகிறது.`,
        },
        {
          question: 'இந்த வெள்ளித் திட்டத்தில் என்னென்ன பொருட்கள் வாங்கலாம்?',
          answer: 'சேமித்த வெள்ளி மதிப்பிற்கு தூய 999 வெள்ளி நாணயங்கள், வெள்ளி பார்கள், பூஜை பொருட்கள், பாத்திரங்கள் அல்லது 925 வெள்ளி நகைகளாகப் பெற்றுக்கொள்ளலாம்.',
        },
        {
          question: 'கட்டணங்கள் பாதுகாப்பானவையா மற்றும் ரசீதுகள் கிடைக்குமா?',
          answer: 'ஆம்! ஒவ்வொரு கட்டணத்திற்கும் உடனடி டிஜிட்டல் ரசீது உருவாக்கப்படும், மேலும் அனைத்து பொருட்களும் 100% தூய்மை சான்றளிக்கப்பட்டவை.',
        },
      ];
    } else if (isFlexi) {
      faqs = [
        {
          question: 'நெகிழ்வான திட்டத்தில் ஒவ்வொரு மாதமும் வெவ்வேறு தொகையைச் செலுத்தலாமா?',
          answer: `ஆம்! நெகிழ்வான திட்டங்களில் ரூ.${minAmount} முதல் உங்கள் வசதிக்கேற்ப எப்போது வேண்டுமானாலும் தொகையைச் செலுத்தி அன்றைய நேரடி விலையில் தங்க எடையைப் பதிவு செய்யலாம்.`,
        },
        {
          question: 'சேமித்த தங்க எடையை எப்போது நகைகளாகப் பெற முடியும்?',
          answer: tenureMonths
            ? `${tenureMonths} மாதங்கள் நிறைவடைந்தவுடன், உங்கள் மொத்த தங்க எடை மற்றும் கூடுதல் போனஸ் எடையுடன் ஹால்மார்க் நகைகளாகப் பெற்றுக்கொள்ளலாம்.`
            : 'திட்டக் காலம் நிறைவடைந்தவுடன், உங்கள் சேமித்த தங்க எடை மற்றும் கூடுதல் போனஸ் எடையுடன் ஹால்மார்க் நகைகளாகப் பெற்றுக்கொள்ளலாம்.',
        },
        {
          question: 'என் தங்கம் பாதுகாப்பாகப் பாதுகாக்கப்படுகிறதா?',
          answer: 'ஆம். நீங்கள் சேமிக்கும் ஒவ்வொரு மில்லிகிராம் தங்கமும் காப்பீடு செய்யப்பட்ட பாதுகாப்பான பெட்டகத்தில் தூய 22K தங்கமாக ஒதுக்கப்படுகிறது.',
        },
      ];
    } else {
      faqs = [
        {
          question: 'நிலையான திட்டத்தில் போனஸ் எவ்வாறு வழங்கப்படுகிறது?',
          answer: tenureMonths
            ? `${tenureMonths} மாதங்கள் தவறாமல் தவணை செலுத்தி முடித்தவுடன், ${jewellerNameTa} 1 மாத போனஸ் தவணையை இலவசமாக உங்கள் சேமிப்பில் இணைக்கும்.`
            : `தவணை காலம் முடித்தவுடன், ${jewellerNameTa} 1 மாத போனஸ் தவணையை இலவசமாக உங்கள் சேமிப்பில் இணைக்கும்.`,
        },
        {
          question: 'தவணைத் தொகையை சரியான நேரத்தில் செலுத்தத் தவறினால் என்ன செய்வது?',
          answer: 'செலுத்தப்படாத தவணைகளை நமது மொபைல் ஆப் மூலமாகவே யுபிஐ அல்லது கார்டு பயன்படுத்தி உடனடியாகச் செலுத்தி ரசீது பெற்றுக்கொள்ளலாம்.',
        },
        {
          question: 'திட்ட முதிர்வில் என்னென்ன நகைகள் வாங்க முடியும்?',
          answer: 'எங்கள் ஷோரூமில் உள்ள அனைத்து வகையான 100% BIS 916 ஹால்மார்க் நகைகளையும் பிரத்யேக செய்கூலி மற்றும் சேதார சலுகைகளுடன் வாங்கலாம்.',
        },
      ];
    }
  } else if (metal === 'silver') {
    faqs = [
      {
        question: 'How is my silver savings value calculated?',
        answer: isFlexi
          ? 'Each payment is converted into 999 fine silver grams based on the live market silver rate on the date and time of payment.'
          : `You pay a fixed monthly installment${tenureMonths ? ` for ${tenureMonths} months` : ''}, and ${jewellerName} contributes a maturity bonus installment.`,
      },
      {
        question: 'What items can I purchase with this silver scheme?',
        answer: 'You can redeem your accumulated silver for 999 pure silver coins, silver bars, pooja articles, dinner sets, or 925 sterling silver jewellery.',
      },
      {
        question: 'Are my payments secure and certified?',
        answer: 'Yes! Instant digital receipts are generated for every transaction, and all silver items are 100% certified for purity.',
      },
    ];
  } else if (isFlexi) {
    faqs = [
      {
        question: 'Can I pay varying amounts each month in a Flexi scheme?',
        answer: `Yes! Flexi schemes allow you to pay any amount starting from ₹${minAmount} whenever you want, locking in gold weight at daily live rates.`,
      },
      {
        question: 'When can I redeem my accumulated gold weight?',
        answer: tenureMonths
          ? `After completing ${tenureMonths} months, you can redeem your full gold weight plus promotional bonus for hallmark jewellery.`
          : 'Upon completing your savings tenure, you can redeem your accumulated gold weight plus promotional bonus for hallmark jewellery.',
      },
      {
        question: 'Is my gold physically allocated and insured?',
        answer: 'Yes. Pure physical gold is allocated for every milligram saved and securely stored with 100% insurance and BIS hallmarking.',
      },
    ];
  } else {
    faqs = [
      {
        question: 'How does the bonus work for Fixed schemes?',
        answer: tenureMonths
          ? `When you complete ${tenureMonths} regular monthly payments, ${jewellerName} contributes a bonus installment free of cost.`
          : `Upon completing your regular monthly payments, ${jewellerName} contributes a bonus installment free of cost.`,
      },
      {
        question: 'What happens if I miss a monthly installment?',
        answer: 'You can easily pay pending installments online via UPI or card directly through this app with instant receipt generation.',
      },
      {
        question: 'What jewellery can I purchase at maturity?',
        answer: 'You can choose from our complete range of BIS 916 hallmarked gold jewellery with exclusive wastage and making charge discounts.',
      },
    ];
  }

  // Extract table_meta from API if available
  let tableMeta: SchemeTableMeta | null = null;
  const rawTable = scheme.table_meta || (Array.isArray(scheme.meta_data) && scheme.meta_data[0]?.table_meta);
  if (rawTable && typeof rawTable === 'object') {
    let headerList: string[] = [];
    if (rawTable.headers) {
      if (Array.isArray(rawTable.headers)) {
        headerList = rawTable.headers;
      } else if (typeof rawTable.headers === 'object') {
        headerList = (rawTable.headers as any)[lang] || rawTable.headers.en || Object.values(rawTable.headers);
      }
    }
    let rowList: string[][] = [];
    if (Array.isArray(rawTable.rows)) {
      rowList = rawTable.rows.map((row: any) => {
        if (Array.isArray(row)) return row.map(String);
        if (typeof row === 'object' && row !== null) return Object.values(row).map(String);
        return [String(row)];
      });
    }
    if (headerList.length > 0 && rowList.length > 0) {
      tableMeta = { headers: headerList, rows: rowList };
    }
  }

  return {
    id: scheme.SCHEMEID || scheme.id || Math.random(),
    name,
    description: desc,
    slogan,
    type: isFlexi ? 'Flexi' : 'Fixed',
    isFlexi,
    savingType: isFlexi ? 'weight' : 'amount',
    metal,
    minAmount,
    tenureMonths,
    tenureText,
    purity,
    bonusText,
    theme,
    aboutParagraph,
    keyMetrics,
    keyBenefits,
    schemeHighlights,
    howItWorksSteps,
    faqs,
    tableMeta,
    brochureUrl: scheme.brochure_url || scheme.BROCHURE_URL,
    rawScheme: scheme,
  };
}

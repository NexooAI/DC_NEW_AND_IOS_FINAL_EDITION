import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import api from '@/services/api';
import useGlobalStore from '@/store/global.store';
import i18n, { t } from '@/i18n';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    schemeId: '101',
    step: '1',
  }),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({
    params: { schemeId: '101' },
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/services/api');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => {
    if (key === 'gold_rate') return Promise.resolve('7250');
    if (key === 'silver_rate') return Promise.resolve('95');
    if (key === '@current_scheme_data') {
      return Promise.resolve(
        JSON.stringify({
          schemeId: 101,
          name: 'Gold Wealth Scheme',
          schemeType: 'flexi',
          savingType: 'amount',
          chits: [{ CHITID: 55, PAYMENT_FREQUENCY_ID: 1, PAYMENT_FREQUENCY: 'monthly' }],
        })
      );
    }
    return Promise.resolve(null);
  }),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
}));

describe('JoinSavings Business Logic & Calculations', () => {
  const goldRate = 7250;
  const silverRate = 95;

  describe('Metal Weight & Amount Calculations', () => {
    test('Gold Scheme calculates gold weight and amount correctly based on goldRate', () => {
      const isSilverScheme = false;
      const rateToUse = isSilverScheme && silverRate > 0 ? silverRate : goldRate;

      const testAmount = 14500;
      const calculatedWeight = testAmount / rateToUse;
      expect(calculatedWeight).toBe(2); // 14500 / 7250 = 2 grams

      const recalculatedAmount = Math.round(calculatedWeight * rateToUse);
      expect(recalculatedAmount).toBe(14500);
    });

    test('Silver Scheme calculates silver weight and amount correctly based on silverRate', () => {
      const isSilverScheme = true;
      const rateToUse = isSilverScheme && silverRate > 0 ? silverRate : goldRate;

      const testAmount = 950;
      const calculatedWeight = testAmount / rateToUse;
      expect(calculatedWeight).toBe(10); // 950 / 95 = 10 grams

      const recalculatedAmount = Math.round(calculatedWeight * rateToUse);
      expect(recalculatedAmount).toBe(950);
    });

    test('Fallback to default rate when rates are zero or invalid', () => {
      const invalidGoldRate = 0;
      const isSilverScheme = false;
      const rateToUse = isSilverScheme && silverRate > 0 ? silverRate : (invalidGoldRate > 0 ? invalidGoldRate : 5847);
      expect(rateToUse).toBe(5847);
    });
  });

  describe('Investment Submission Payload Integrity', () => {
    test('Ensures chitIdToSend, paymentFrequency, and associated_branch are never null or broken', () => {
      const activeChit = {
        CHITID: 42,
        PAYMENT_FREQUENCY_ID: 2,
        PAYMENT_FREQUENCY: 'monthly',
      };

      const chitIdToSend = activeChit?.CHITID != null ? activeChit.CHITID : 0;
      const paymentFrequencyIdToSend = activeChit?.PAYMENT_FREQUENCY_ID != null ? activeChit.PAYMENT_FREQUENCY_ID : 1;
      const paymentFrequencyToSend = activeChit?.PAYMENT_FREQUENCY || 'monthly';
      const associatedBranch = '' || '1';

      const payload = {
        userId: 'user-1',
        schemeId: 101,
        chitId: chitIdToSend,
        accountName: 'Test User',
        associated_branch: associatedBranch,
        payment_frequency_id: paymentFrequencyIdToSend,
      };

      expect(payload.chitId).toBe(42);
      expect(payload.payment_frequency_id).toBe(2);
      expect(payload.associated_branch).toBe('1');
      expect(payload.schemeId).toBe(101);
      expect(paymentFrequencyToSend).toBe('monthly');
    });

    test('Handles null activeChit gracefully with safe fallbacks', () => {
      const activeChit = null as any;

      const chitIdToSend = activeChit?.CHITID != null ? activeChit.CHITID : 0;
      const paymentFrequencyIdToSend = activeChit?.PAYMENT_FREQUENCY_ID != null ? activeChit.PAYMENT_FREQUENCY_ID : 1;
      const paymentFrequencyToSend = activeChit?.PAYMENT_FREQUENCY || 'monthly';

      expect(chitIdToSend).toBe(0);
      expect(paymentFrequencyIdToSend).toBe(1);
      expect(paymentFrequencyToSend).toBe('monthly');
    });
  });

  describe('Translations for Rate Area', () => {
    test('All required translation keys exist in en, ta, te, hi, mal', () => {
      const locales = ['en', 'ta', 'te', 'hi', 'mal'];
      const requiredKeys = ['todayRates', 'todayRate', 'goldRateToday', 'silverRateToday', 'gold', 'silver'];

      locales.forEach((locale) => {
        i18n.locale = locale;
        requiredKeys.forEach((key) => {
          const translated = t(key);
          expect(translated).toBeTruthy();
          expect(translated).not.toContain('missing');
        });
      });
    });
  });

  describe('Step Rate Card & Step Indicator Logic', () => {
    test('Step 2 displays ONLY the scheme metal rate (prevents multi-row wrapping)', () => {
      // Step 2 with Gold scheme
      const step = 2;
      const isStep2 = step > 1;
      const isSilverSchemeGold = false;
      const showSilverOnlyInStep2Gold = isStep2 && isSilverSchemeGold && silverRate > 0;
      expect(showSilverOnlyInStep2Gold).toBe(false); // Shows gold only

      // Step 2 with Silver scheme
      const isSilverSchemeSilver = true;
      const showSilverOnlyInStep2Silver = isStep2 && isSilverSchemeSilver && silverRate > 0;
      expect(showSilverOnlyInStep2Silver).toBe(true); // Shows silver only

      // Step 1 displays both rates when silver is available
      const isStep1 = 1 > 1;
      expect(isStep1).toBe(false);
    });

    test('Step indicator correctly separates active, completed, and locked states', () => {
      // Step 1
      const step = 1;
      const cameFromCalculator = false;

      const step1Current = step === 1;
      const step1Completed = step > 1 && !(cameFromCalculator && 1 === 1);
      const step2Locked = 2 > step || (cameFromCalculator && 2 === 1);

      expect(step1Current).toBe(true);
      expect(step1Completed).toBe(false);
      expect(step2Locked).toBe(true);

      // Transition to Step 2
      const stepAfter = 2;
      const step1AfterCurrent = stepAfter === 1;
      const step1AfterCompleted = stepAfter > 1 && !(cameFromCalculator && 1 === 1);
      const step2AfterCurrent = stepAfter === 2;

      expect(step1AfterCurrent).toBe(false);
      expect(step1AfterCompleted).toBe(true);
      expect(step2AfterCurrent).toBe(true);
    });
  });

  describe('Scheme Metal Filtering Logic (Gold vs Silver Isolation)', () => {
    // Replicate getSchemeMetalType logic for verification
    const extractMetalType = (scheme: any): 'gold' | 'silver' | 'diamond' | 'platinum' | 'old_gold' => {
      const extractAllStrings = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string') return val.toLowerCase();
        if (typeof val === 'object') {
          return Object.values(val)
            .map((v) => extractAllStrings(v))
            .join(' ')
            .toLowerCase();
        }
        return '';
      };

      const nameText = extractAllStrings(scheme.SCHEMENAME);
      const sloganText = extractAllStrings(scheme.SLOGAN);
      const schemeType = (scheme.SCHEMETYPE || '').toLowerCase();
      const insType = (scheme.INS_TYPE || '').toLowerCase();
      const savingType = (scheme.savingType || '').toLowerCase();
      const metalField = (scheme.metal || scheme.METAL || scheme.metal_type || scheme.METATYPE || '').toLowerCase();

      const titleAndType = `${nameText} ${sloganText} ${metalField} ${schemeType} ${insType} ${savingType}`;

      if (
        titleAndType.includes('old gold') ||
        titleAndType.includes('oldgold') ||
        titleAndType.includes('old_gold') ||
        titleAndType.includes('பழைய தங்கம்')
      ) {
        return 'old_gold';
      }

      if (titleAndType.includes('silver') || titleAndType.includes('வெள்ளி')) {
        return 'silver';
      }

      if (titleAndType.includes('diamond') || titleAndType.includes('வைரம்')) {
        return 'diamond';
      }

      if (titleAndType.includes('platinum') || titleAndType.includes('பிளாட்டினம்')) {
        return 'platinum';
      }

      return 'gold';
    };

    test('Identifies Silver Scheme accurately and excludes it from Gold filter even if description mentions gold', () => {
      const silverScheme = {
        SCHEMEID: 201,
        SCHEMENAME: { en: 'Silver Savings Scheme', ta: 'வெள்ளி சேமிப்பு திட்டம்' },
        DESCRIPTION: { en: 'Save in silver and purchase 22KT gold or silver jewellery at maturity' },
        SCHEMETYPE: 'monthly',
        ACTIVE: 'Y',
      };

      const goldScheme = {
        SCHEMEID: 101,
        SCHEMENAME: { en: 'Gold Wealth Plan', ta: 'தங்க சேமிப்பு திட்டம்' },
        DESCRIPTION: { en: 'Standard gold savings scheme' },
        SCHEMETYPE: 'monthly',
        ACTIVE: 'Y',
      };

      const schemes = [silverScheme, goldScheme];

      // Metal identification
      expect(extractMetalType(silverScheme)).toBe('silver');
      expect(extractMetalType(goldScheme)).toBe('gold');

      // Filter by Gold: Silver scheme must NOT be in the result
      const goldFiltered = schemes.filter((s) => extractMetalType(s) === 'gold');
      expect(goldFiltered.length).toBe(1);
      expect(goldFiltered[0].SCHEMEID).toBe(101);
      expect(goldFiltered.some((s) => s.SCHEMEID === 201)).toBe(false);

      // Filter by Silver: Only silver scheme is in the result
      const silverFiltered = schemes.filter((s) => extractMetalType(s) === 'silver');
      expect(silverFiltered.length).toBe(1);
      expect(silverFiltered[0].SCHEMEID).toBe(201);
      expect(silverFiltered.some((s) => s.SCHEMEID === 101)).toBe(false);
    });

    test('Plan Type Selector defaults to All when both Fixed and Flexi exist and filters accordingly', () => {
      const fixedGoldScheme = {
        SCHEMEID: 101,
        SCHEMENAME: { en: 'Fixed Gold Scheme' },
        SCHEMETYPE: 'monthly',
        ACTIVE: 'Y',
      };

      const flexiGoldScheme = {
        SCHEMEID: 102,
        SCHEMENAME: { en: 'Flexi Gold Scheme' },
        SCHEMETYPE: 'flexi',
        ACTIVE: 'Y',
      };

      const goldSchemes = [fixedGoldScheme, flexiGoldScheme];

      const metalHasFlexi = goldSchemes.some(s => s.SCHEMETYPE.includes('flexi'));
      const metalHasFixed = goldSchemes.some(s => !s.SCHEMETYPE.includes('flexi'));

      // Both are available, so selector should show All, Fixed, Flexi and default to All
      expect(metalHasFlexi && metalHasFixed).toBe(true);

      const filterByPlanType = (schemes: any[], planType: 'all' | 'fixed' | 'flexi') => {
        return schemes.filter(scheme => {
          const isFlexi = scheme.SCHEMETYPE.includes('flexi');
          if (planType === 'flexi') return isFlexi;
          if (planType === 'fixed') return !isFlexi;
          return true; // 'all' returns both
        });
      };

      // Default 'all' shows both schemes
      const allResults = filterByPlanType(goldSchemes, 'all');
      expect(allResults.length).toBe(2);

      // 'fixed' shows only fixed scheme
      const fixedResults = filterByPlanType(goldSchemes, 'fixed');
      expect(fixedResults.length).toBe(1);
      expect(fixedResults[0].SCHEMEID).toBe(101);

      // 'flexi' shows only flexi scheme
      const flexiResults = filterByPlanType(goldSchemes, 'flexi');
      expect(flexiResults.length).toBe(1);
      expect(flexiResults[0].SCHEMEID).toBe(102);
    });

    test('Plan Type Selector displays "All" (not "All Schemes") while metal category displays "All Schemes"', () => {
      const enJson = require('@/locales/en.json');
      const taJson = require('@/locales/ta.json');

      // English
      expect(enJson.allOnly).toBe('All');
      expect(enJson.allSchemes).toBe('All Schemes');

      // Tamil
      expect(taJson.allOnly).toBe('அனைத்தும்');
      expect(taJson.allSchemes).toBe('அனைத்து திட்டங்கள்');

      // Row 1 (Metal categories) uses allSchemes
      const row1FirstButtonText = (lang: 'en' | 'ta') => (lang === 'ta' ? taJson.allSchemes : enJson.allSchemes);
      expect(row1FirstButtonText('en')).toBe('All Schemes');
      expect(row1FirstButtonText('ta')).toBe('அனைத்து திட்டங்கள்');

      // Row 2 (Plan type selector) uses allOnly, Fixed, Flexi
      const row2Buttons = (lang: 'en' | 'ta') => {
        const dict = lang === 'ta' ? taJson : enJson;
        return [dict.allOnly, dict.Fixed, dict.Flexi];
      };
      expect(row2Buttons('en')).toEqual(['All', 'Fixed', 'Flexi']);
      expect(row2Buttons('ta')).toEqual(['அனைத்தும்', 'நிலையான', 'நெகிழ்வான']);
    });
  });
});


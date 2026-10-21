import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { logger } from '@/utils/logger';

export interface InvestmentRule {
  id?: string | number;
  minPayment: number;
  maxPayment: number;
  rewardType: 'fixed' | 'percentage';
  rewardValue: number;
  displayAmount: string;
  displayReward: string;
}

export interface ReferralConfig {
  signupBonus: number; // Install & sign up instant points
  investmentRules: InvestmentRule[];
}

const CACHE_KEY = 'cached_referral_rules_v2';

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  signupBonus: 10,
  investmentRules: [
    {
      id: 14,
      minPayment: 100,
      maxPayment: 1000,
      rewardType: 'fixed',
      rewardValue: 75,
      displayAmount: '₹100 to ₹1,000',
      displayReward: '75 Points',
    },
    {
      id: 15,
      minPayment: 1001,
      maxPayment: 5000,
      rewardType: 'fixed',
      rewardValue: 250,
      displayAmount: '₹1,001 to ₹5,000',
      displayReward: '250 Points',
    },
    {
      id: 16,
      minPayment: 5001,
      maxPayment: 10000,
      rewardType: 'fixed',
      rewardValue: 500,
      displayAmount: '₹5,001 to ₹10,000',
      displayReward: '500 Points',
    },
    {
      id: 17,
      minPayment: 10001,
      maxPayment: 100000,
      rewardType: 'fixed',
      rewardValue: 600,
      displayAmount: '₹10,001 to ₹1,00,000',
      displayReward: '600 Points',
    },
  ],
};

/**
 * Formats min and max numbers into a user-friendly Indian currency range string
 */
export const formatAmountRange = (min: number, max: number): string => {
  const formattedMin = `₹${min.toLocaleString('en-IN')}`;
  if (max >= 1000000 || max <= 0) {
    return min > 10000 ? `Above ₹${(min - 1).toLocaleString('en-IN')}` : `Above ${formattedMin}`;
  }
  const formattedMax = `₹${max.toLocaleString('en-IN')}`;
  return `${formattedMin} to ${formattedMax}`;
};

/**
 * Formats reward value into display string (Points or %)
 */
export const formatRewardValue = (type: string, value: number): string => {
  const isPercent = type?.toLowerCase?.().includes('percent') || false;
  if (isPercent) {
    return `${value}% of Amount`;
  }
  return `${value} Points`;
};

/**
 * Normalizes raw server rule objects into typed InvestmentRule[]
 */
export const parseRawInvestmentRules = (rawList: any[]): InvestmentRule[] => {
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return DEFAULT_REFERRAL_CONFIG.investmentRules;
  }

  const results: InvestmentRule[] = [];

  for (let idx = 0; idx < rawList.length; idx++) {
    const item = rawList[idx];
    if (!item) continue;
    const min = parseFloat(
      String(item.min_investment ?? item.min_payment ?? item.minPayment ?? item.min_amount ?? item.min ?? 0)
    ) || 0;
    const max = parseFloat(
      String(item.max_investment ?? item.max_payment ?? item.maxPayment ?? item.max_amount ?? item.max ?? 0)
    ) || 0;
    const val = parseFloat(
      String(item.reward_value ?? item.rewardValue ?? item.points ?? item.value ?? 0)
    ) || 0;
    const rawType = String(item.reward_type ?? item.rewardType ?? item.type ?? 'fixed').toLowerCase();
    const type: 'fixed' | 'percentage' = rawType.includes('percent') ? 'percentage' : 'fixed';

    if (val <= 0 && min <= 0 && max <= 0) continue;

    results.push({
      id: item.id || idx + 1,
      minPayment: min,
      maxPayment: max,
      rewardType: type,
      rewardValue: val,
      displayAmount: formatAmountRange(min, max),
      displayReward: formatRewardValue(type, val),
    });
  }

  return results.length > 0 ? results : DEFAULT_REFERRAL_CONFIG.investmentRules;
};

/**
 * Extracts and normalizes referral config from various possible API response structures
 */
export const normalizeReferralResponse = (rawData: any): ReferralConfig | null => {
  if (!rawData) return null;

  let signupBonus = DEFAULT_REFERRAL_CONFIG.signupBonus;
  let rawRules: any[] | null = null;

  const data = rawData.data || rawData;

  // Check for signup bonus
  const possibleBonus =
    data.signup_bonus ??
    data.signupBonus ??
    data.install_bonus ??
    data.installBonus ??
    data.default_points ??
    data.defaultPoints ??
    data.install_signup_bonus;

  if (possibleBonus !== undefined && !isNaN(Number(possibleBonus))) {
    signupBonus = Number(possibleBonus);
  }

  // Check for investment rules in data
  if (Array.isArray(data)) {
    rawRules = data;
  } else if (Array.isArray(data.data)) {
    rawRules = data.data;
  } else if (Array.isArray(data.investment_rules)) {
    rawRules = data.investment_rules;
  } else if (Array.isArray(data.investmentRules)) {
    rawRules = data.investmentRules;
  } else if (Array.isArray(data.rules)) {
    rawRules = data.rules;
  } else if (Array.isArray(data.tiers)) {
    rawRules = data.tiers;
  } else if (Array.isArray(data.referral_rules)) {
    rawRules = data.referral_rules;
  }

  if (rawRules) {
    return {
      signupBonus,
      investmentRules: parseRawInvestmentRules(rawRules),
    };
  }

  // If only signup bonus was found but no rules array
  if (possibleBonus !== undefined) {
    return {
      signupBonus,
      investmentRules: DEFAULT_REFERRAL_CONFIG.investmentRules,
    };
  }

  return null;
};

class ReferralService {
  /**
   * Retrieves cached referral config from AsyncStorage for instant render
   */
  async getCachedConfig(): Promise<ReferralConfig> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.investmentRules)) {
          return parsed;
        }
      }
    } catch (e) {
      logger.error('Error reading cached referral rules:', e);
    }
    return DEFAULT_REFERRAL_CONFIG;
  }

  /**
   * Fetches latest referral rules from backend, caches it, and returns the config
   */
  async fetchRemoteConfig(walletPayload?: any): Promise<ReferralConfig> {
    // 1. If wallet payload was passed in and contains rules/bonus, parse directly
    if (walletPayload) {
      const normalizedFromWallet = normalizeReferralResponse(walletPayload);
      if (normalizedFromWallet && normalizedFromWallet.investmentRules.length > 0) {
        await this.saveCache(normalizedFromWallet);
        return normalizedFromWallet;
      }
    }

    // 2. Try fetching from server endpoints
    const endpoints = [
      '/rewards/referral-investment-config',
      '/rewards/rules',
      '/rewards/referral-rules',
      '/config/referral-rules',
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint, { skipLoading: true } as any);
        if (response?.data) {
          const normalized = normalizeReferralResponse(response.data);
          if (normalized && normalized.investmentRules.length > 0) {
            await this.saveCache(normalized);
            logger.log(`✅ Referral rules dynamically fetched from ${endpoint}`, normalized);
            return normalized;
          }
        }
      } catch (err: any) {
        logger.log(`ℹ️ Attempted ${endpoint}: status ${err?.response?.status || err?.message}`);
      }
    }

    // 3. Fallback to cached or defaults
    return this.getCachedConfig();
  }

  private async saveCache(config: ReferralConfig): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(config));
    } catch (e) {
      logger.error('Error saving referral rules cache:', e);
    }
  }
}

export const referralService = new ReferralService();
export default referralService;

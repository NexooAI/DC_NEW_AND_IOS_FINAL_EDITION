export type SchemeDetailTab = 'overview' | 'benefits' | 'how_it_works' | 'faqs';

export interface SchemeTableMeta {
  headers: string[];
  rows: string[][];
}

export interface SchemeTheme {
  key: string;
  gradientColors: [string, string, string];
  accentColor: string;
  badgeColor: string;
  badgeTextColor: string;
  badgeText: string;
  badgeIcon: string;
  secondaryBadgeText?: string;
  buttonBackground: string;
  buttonTextColor: string;
  cardGlow: string;
  metalName: string;
  assetType: 'necklace' | 'gold_bars' | 'silver_bars' | 'bangles' | 'kalash' | 'amber_coins' | 'diamond' | 'antique';
  features: [
    { icon: string; label: string },
    { icon: string; label: string },
    { icon: string; label: string }
  ];
}

export interface ParsedSchemeV2 {
  id: number | string;
  name: string;
  description: string;
  slogan: string;
  type: string; // "Flexi", "Fixed", "Daily", "Weekly", "Monthly"
  isFlexi: boolean;
  savingType: 'amount' | 'weight';
  metal: 'gold' | 'silver' | 'diamond' | 'platinum' | 'old_gold';
  minAmount: number;
  tenureMonths?: number | null;
  tenureText: string;
  purity: string;
  bonusText: string;
  theme: SchemeTheme;
  aboutParagraph: string;
  keyMetrics: Array<{ label: string; value: string; icon: string }>;
  keyBenefits: Array<{
    title: string;
    subtitle: string;
    icon: string;
  }>;
  schemeHighlights: string[];
  howItWorksSteps: Array<{
    step: number;
    title: string;
    desc: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  tableMeta?: SchemeTableMeta | null;
  brochureUrl?: string;
  rawScheme: any;
}

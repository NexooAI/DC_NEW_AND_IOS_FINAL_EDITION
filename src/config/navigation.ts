// config/navigation.ts
export type RootStackParamList = {
    '(public)': undefined;
    '(app)': undefined;
    '(auth)': undefined;
    '(products)': undefined;
    // Add other screen params
  };
  
  declare global {
    namespace ReactNavigation {
      interface RootParamList extends RootStackParamList {}
    }
  }

// Routes that should hide the bottom tabs
export const HIDE_TABS_ROUTES = [
  'offers',
  'refer_earn', 
  'our_stores',
  'contact_us',
  'about_us',
  'faq',
  'ourPolicies',
  'privacyPolicy',
  'termsAndConditionsPolicies',
  'StoreLocator',
  'paymentNewOverView',
  'payment-success',
  'payment-failure',
] as const;

// Helper function to check if current route should hide tabs
export const shouldHideTabs = (currentRoute: string): boolean => {
  return HIDE_TABS_ROUTES.includes(currentRoute as any);
};
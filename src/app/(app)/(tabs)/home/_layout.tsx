import { Stack } from "expo-router";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useIsFocused } from "@react-navigation/native";

export default function HomeLayout() {
  const theme = useAppTheme();
  const { setTabVisibility } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  useEffect(() => {
    // Default to showing tabs when entering the home stack
    setTabVisibility(true);
  }, [setTabVisibility]);

  return (
    <>
      {isFocused && (
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.quaternary || '#F2E6D2'}
        />
      )}
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.quaternary,
          },
          headerTintColor: theme.colors.textDark,
          headerTitleAlign: 'center', // Center align the header title
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: Platform.OS === 'android' ? 16 : 18, // Slightly smaller font on Android
          },
          headerShadowVisible: false,
        }}
      >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="productsdetails"
        options={{ title: "Product Details" }}
      />
      <Stack.Screen
        name="join_savings"
        options={{ title: "Join Schemes" }}
      />
      <Stack.Screen
        name="digigold_payment_calculator"
        options={{ title: "DigiGold Payment Calculator" }}
      />
      <Stack.Screen
        name="schemes"
        options={{ title: "Schemes" }}
      />
      <Stack.Screen
        name="kyc"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="policies/termsAndConditionsPolicies"
        options={{
          title: "Terms & Conditions",
        }}
      />
      <Stack.Screen
        name="policies/ourPolicies"
        options={{
          title: "Our Policies",
        }}
      />
      <Stack.Screen
        name="policies/privacyPolicy"
        options={{
          title: "Privacy Policy",
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          title: "FAQ",
        }}
      />
      <Stack.Screen
        name="(storeInfo)/contact_us"
        options={{
          title: "Contact Us",
        }}
      />
      <Stack.Screen
        name="offers"
        options={{
          title: "Our Offers",
        }}
      />
      <Stack.Screen
        name="StoreLocator"
        options={{ title: "Store Locator" }}
      />
      <Stack.Screen
        name="our_stores"
        options={{
          title: "Our Stores",
        }}
      />
      <Stack.Screen
        name="refer_earn"
        options={{
          title: "Refer & Earn",
        }}
      />
      <Stack.Screen
        name="paymentNewOverView"
        options={{ title: "Payment Process" }}
      />
      <Stack.Screen
        name="PaymentWebView"
        options={{ title: "Payment WebView" }}
      />
      <Stack.Screen
        name="payment-success"
        options={{
          title: "Payment Success",
          headerBackVisible: false,
          gestureEnabled: false,
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="payment-failure"
        options={{
          title: "Payment Failure",
          headerBackVisible: false,
          gestureEnabled: false,
          headerLeft: () => null
        }}
      />
      <Stack.Screen
        name="faq-chat"
        options={{ title: "FAQ Chat" }}
      />
      <Stack.Screen
        name="ticket-form"
        options={{ title: "Create Ticket" }}
      />
      <Stack.Screen
        name="ratechart"
        options={{ title: "Rate Chart" }}
      />
      <Stack.Screen
        name="BookingHistory"
        options={{ headerShown: false }}
      />
      {/* <Stack.Screen name="live-rates" options={{ title: "Live Rate", headerShown: false }} /> */}
      </Stack>
    </>
  );
}

import { Stack } from "expo-router";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
export default function HomeLayout() {
  const theme = useAppTheme();
  const { setTabVisibility } = useGlobalStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Default to showing tabs when entering the home stack
    setTabVisibility(true);
  }, [setTabVisibility]);

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.background || '#fafafa'}
      />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.colors.background || '#fafafa',
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="policies/ourPolicies"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="policies/privacyPolicy"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="faq"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(storeInfo)/contact_us"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(storeInfo)/about_us"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="offers"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="StoreLocator"
        options={{ title: "Store Locator" }}
      />
      <Stack.Screen
        name="our_stores"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="refer_earn"
        options={{
          headerShown: false,
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

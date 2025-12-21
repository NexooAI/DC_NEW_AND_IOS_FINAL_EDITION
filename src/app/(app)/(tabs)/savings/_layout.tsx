import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';

export default function SavingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide Stack header - Tabs layout already provides header
        headerStyle: {
          backgroundColor: theme.colors.primary,
          height: 100, // Explicitly set header height
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Savings',
        }}
      />
      <Stack.Screen
        name="SavingsDetail"
        options={{
          title: 'Savings Detail',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
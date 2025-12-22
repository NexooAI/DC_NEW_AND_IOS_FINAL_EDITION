import { Stack } from 'expo-router';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';

export default function SavingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
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
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="mpin" />
      <Stack.Screen name="mpin_verify" />
      <Stack.Screen name="reset_mpin" />
      <Stack.Screen name="forgot_mpin" />
      <Stack.Screen name="setmpin" />
      <Stack.Screen name="userBasicDetails" />
      <Stack.Screen name="AuthScreen" />
    </Stack>
  );
} 
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the actual login page in the auth group
    router.replace('/(auth)/login');
  }, []);

  return null;
} 
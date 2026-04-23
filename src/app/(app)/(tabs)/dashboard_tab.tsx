import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function DashboardTab() {
  const router = useRouter();

  useEffect(() => {
    // Fallback redirect just in case the tabPress listener doesn't catch it
    router.replace('/(app)/dashboard');
  }, [router]);

  return null;
}

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAppConfig } from "@/store/global.store";

export default function DashboardTab() {
  const router = useRouter();

  useEffect(() => {
    // Fallback redirect just in case the tabPress listener doesn't catch it
    const hasDashboard = getAppConfig().constants.enableDashboard;
    router.replace(hasDashboard ? '/(app)/dashboard' : '/(app)/(tabs)/home');
  }, [router]);

  return null;
}

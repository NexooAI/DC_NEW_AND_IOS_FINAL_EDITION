import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getAppConfig } from "@/store/global.store";
import { useAppVisibility, resolveDashboardVisibility } from "@/hooks/useAppVisibility";

export default function DashboardTab() {
  const router = useRouter();
  const { visibleData } = useAppVisibility();

  useEffect(() => {
    // Fallback redirect just in case the tabPress listener doesn't catch it
    const hasDashboard = resolveDashboardVisibility(visibleData) || Boolean(getAppConfig().constants.enableDashboard);
    router.replace(hasDashboard ? '/(app)/dashboard' : '/(app)/(tabs)/home');
  }, [router, visibleData]);

  return null;
}

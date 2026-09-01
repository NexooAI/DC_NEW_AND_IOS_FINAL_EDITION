import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function OffersTab() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the offers screen inside home tab
    router.replace('/(app)/(tabs)/home/offers');
  }, [router]);

  return null;
}

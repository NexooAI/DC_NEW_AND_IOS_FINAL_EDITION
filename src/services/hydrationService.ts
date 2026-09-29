import api, { investmentAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { preloadPosters } from '@/utils/mediaCache';
import { logger } from '@/utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';

let isHydrating = false;

/**
 * Hydrates all critical customer and application data into RAM (Zustand) and Disk (AsyncStorage).
 * Runs on:
 * 1. Login / MPIN verification
 * 2. App startup (if user is authenticated)
 * 3. Pull-to-refresh or post-payment refresh
 * 
 * @param userId - Target user ID (optional, defaults to current logged in user)
 * @param forceRefresh - If true, bypasses TTL cache checks and forces fresh API fetch
 */
export const hydrateCustomerData = async (
  userId?: string | number,
  forceRefresh: boolean = false
): Promise<void> => {
  const store = useGlobalStore.getState();
  const currentUserId = userId || store.user?.id;

  if (!currentUserId) {
    logger.warn('⚠️ [Hydration] No userId available, skipping hydration');
    return;
  }

  // If not forcing refresh, check if cache is still valid
  if (!forceRefresh && store.isHomeBundleValid() && store.isInvestmentsCacheValid()) {
    logger.log('📦 [Hydration] In-memory customer cache is still valid. Skipping network hit.');
    return;
  }

  if (isHydrating) {
    logger.log('⏳ [Hydration] Hydration is already in flight, skipping duplicate call.');
    return;
  }

  isHydrating = true;
  logger.log(`🚀 [Hydration] Starting user hydration for userId: ${currentUserId} (forceRefresh: ${forceRefresh})`);

  try {
    const promises: Promise<any>[] = [
      // 1. Home Dashboard Bundle (rates, banners, collections, summaries)
      api.get(`/home?userId=${currentUserId}`, { skipLoading: true } as any).catch((err: any) => {
        logger.error('❌ [Hydration] Error fetching /home bundle:', err);
        return null;
      }),

      // 2. Full Customer Investments / Schemes / Passbook
      investmentAPI.getUserInvestments(currentUserId).catch((err: any) => {
        logger.error('❌ [Hydration] Error fetching investments:', err);
        return null;
      }),

      // 3. Dynamic App Visibility Configuration
      api.get('/app-visible', { skipLoading: true } as any).catch((err: any) => {
        logger.error('❌ [Hydration] Error fetching /app-visible:', err);
        return null;
      }),
    ];

    const [homeRes, investmentsRes, visibilityRes] = await Promise.allSettled(promises);

    const posterUrlsToPreload: string[] = [];

    // Handle Home Bundle Result
    if (homeRes.status === 'fulfilled' && homeRes.value?.data?.success) {
      const homeData = homeRes.value.data;
      store.setHomeBundleData(homeData);

      // Save to AsyncStorage backup
      try {
        await AsyncStorage.setItem('cached_home_data', JSON.stringify(homeData));
      } catch (err) {
        logger.error('Error saving cached_home_data backup:', err);
      }

      const innerData = homeData.data || {};

      // Extract KYC status if present
      if (innerData.kycStatus) {
        store.setCustomerKyc(innerData.kycStatus);
      }

      // Collect banner & poster URLs to preload into local disk
      if (Array.isArray(innerData.posters)) {
        innerData.posters.forEach((p: any) => {
          const img = p.image || p.image_url;
          if (img) posterUrlsToPreload.push(img);
        });
      }

      if (Array.isArray(innerData.sliderImages)) {
        innerData.sliderImages.forEach((s: any) => {
          const img = s.image || s.image_url;
          if (img) posterUrlsToPreload.push(img);
        });
      }

      if (Array.isArray(innerData.collections)) {
        innerData.collections.forEach((c: any) => {
          const img = c.image || c.image_url;
          if (img) posterUrlsToPreload.push(img);
        });
      }

      // If home API returned investments and user_investments failed, fallback to it
      if (Array.isArray(innerData.investments) && !store.customerInvestments) {
        store.setCustomerInvestments(innerData.investments);
      }
    }

    // Handle Investments Result
    if (investmentsRes.status === 'fulfilled' && investmentsRes.value?.data) {
      const invPayload = investmentsRes.value.data;
      const invList = Array.isArray(invPayload)
        ? invPayload
        : invPayload.data && Array.isArray(invPayload.data)
        ? invPayload.data
        : invPayload.investments || null;

      if (invList) {
        store.setCustomerInvestments(invList);
        logger.log(`✅ [Hydration] Stored ${invList.length} investments in RAM`);
      }
    }

    // Handle Visibility Result
    if (visibilityRes.status === 'fulfilled' && visibilityRes.value?.data) {
      store.setCachedVisibility(visibilityRes.value.data);
      logger.log('✅ [Hydration] Updated app visibility config in RAM');
    }

    // Trigger background pre-download for all collected posters/banners
    if (posterUrlsToPreload.length > 0) {
      preloadPosters(posterUrlsToPreload).catch((err: any) => {
        logger.warn('⚠️ [Hydration] Background poster preloading warning:', err);
      });
    }

    logger.log('✨ [Hydration] Full customer hydration completed successfully!');
  } catch (error) {
    logger.error('❌ [Hydration] Error during customer hydration:', error);
  } finally {
    isHydrating = false;
  }
};

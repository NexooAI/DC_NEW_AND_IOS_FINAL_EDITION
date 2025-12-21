import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

import { logger } from '@/utils/logger';
const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await SecureStore.getItemAsync(FIRST_LAUNCH_KEY);
        setIsFirstLaunch(!hasLaunched);
      } catch (error) {
        logger.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const markAsLaunched = async () => {
    try {
      await SecureStore.setItemAsync(FIRST_LAUNCH_KEY, 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      logger.error('Error marking as launched:', error);
    }
  };

  return { isFirstLaunch, markAsLaunched };
};
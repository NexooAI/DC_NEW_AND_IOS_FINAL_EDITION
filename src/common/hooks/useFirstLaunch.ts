import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { logger } from '@/utils/logger';
const FIRST_LAUNCH_KEY = 'hasLaunchedBefore';

export const useFirstLaunch = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      // Set a timeout of 1.5s in case storage reading hangs
      const timeout = setTimeout(() => {
        if (isFirstLaunch === null) {
          logger.warn('⚠️ checkFirstLaunch storage read timed out. Falling back to false.');
          setIsFirstLaunch(false);
        }
      }, 1500);

      try {
        const hasLaunched = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
        clearTimeout(timeout);
        setIsFirstLaunch(!hasLaunched);
      } catch (error) {
        clearTimeout(timeout);
        logger.error('Error checking first launch:', error);
        setIsFirstLaunch(false);
      }
    };

    checkFirstLaunch();
  }, []);

  const markAsLaunched = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      logger.error('Error marking as launched:', error);
    }
  };

  return { isFirstLaunch, markAsLaunched };
};
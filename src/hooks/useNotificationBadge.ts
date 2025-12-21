import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import useGlobalStore from '@/store/global.store';

import { logger } from '@/utils/logger';
export const useNotificationBadge = () => {
  const [badgeCount, setBadgeCount] = useState(0);
  const { user } = useGlobalStore();

  const fetchUnreadNotifications = async () => {
    if (!user?.id) return;

    try {
      const response = await api.get(`/notifications/unread-count/${user.id}`);
      const count = response.data.count || 0;
      setBadgeCount(count);
      
      // Store the count locally for offline access
      await AsyncStorage.setItem('notificationBadgeCount', count.toString());
    } catch (error) {
      logger.error('Error fetching unread notifications:', error);
      // Fallback to stored count
      const storedCount = await AsyncStorage.getItem('notificationBadgeCount');
      if (storedCount) {
        setBadgeCount(parseInt(storedCount, 10));
      }
    }
  };

  const clearBadge = async () => {
    setBadgeCount(0);
    await AsyncStorage.setItem('notificationBadgeCount', '0');
  };

  const incrementBadge = async () => {
    const newCount = badgeCount + 1;
    setBadgeCount(newCount);
    await AsyncStorage.setItem('notificationBadgeCount', newCount.toString());
  };

  useEffect(() => {
    fetchUnreadNotifications();
    
    // Set up interval to refresh badge count
    const interval = setInterval(fetchUnreadNotifications, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

  return {
    badgeCount,
    clearBadge,
    incrementBadge,
    refreshBadge: fetchUnreadNotifications,
  };
}; 
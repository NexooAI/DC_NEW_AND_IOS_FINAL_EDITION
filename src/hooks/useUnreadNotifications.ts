import { useState, useEffect } from 'react';
import { userAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    status: 'read' | 'unread';
    created_at: string;
    updated_at: string;
}

interface NotificationResponse {
    [key: string]: Notification[];
}

// Module-level cache variables to share fetching state across component instances
let lastFetchTime = 0;
let activeFetchPromise: Promise<number> | null = null;

export const useUnreadNotifications = () => {
    const [loading, setLoading] = useState(false);
    const { user, unreadNotificationsCount: unreadCount, setUnreadNotificationsCount: setUnreadCount } = useGlobalStore();

    const fetchUnreadCount = async (force: boolean = false) => {
        if (!user?.id) {
            setUnreadCount(0);
            return 0;
        }

        // 1. If there is already an active fetch promise in progress, return it to deduplicate concurrent calls
        if (activeFetchPromise) {
            logger.log('🔔 useUnreadNotifications: Awaiting existing active fetch promise...');
            return activeFetchPromise;
        }

        // 2. Throttle checks: skip API call if fetched successfully in the last 10 seconds (unless forced)
        const now = Date.now();
        if (!force && now - lastFetchTime < 10000) {
            logger.log('🔔 useUnreadNotifications: Skipping request (throttled, last fetch was ' + Math.round((now - lastFetchTime) / 1000) + 's ago)');
            return unreadCount;
        }

        // 3. Create active fetch promise
        activeFetchPromise = (async () => {
            try {
                setLoading(true);
                logger.log('🔔 [API] Fetching unread notifications count for user:', user.id);

                const response = await userAPI.getNotifications(user.id!);
                const data: NotificationResponse = response.data;

                logger.log('📊 [API] Notifications API response for badge:', data);

                let totalUnread = 0;
                if (data) {
                    if (Array.isArray(data)) {
                        totalUnread = data.filter(
                            (notification) => notification.status === 'unread'
                        ).length;
                    } else if ((data as any).success && Array.isArray((data as any).data)) {
                        totalUnread = (data as any).data.filter(
                            (notification: any) => notification.status === 'unread'
                        ).length;
                    } else if (typeof data === 'object') {
                        // Count unread notifications across all categories
                        Object.values(data).forEach((notifications) => {
                            if (Array.isArray(notifications)) {
                                const unreadInCategory = notifications.filter(
                                    (notification) => notification.status === 'unread'
                                ).length;
                                totalUnread += unreadInCategory;
                            }
                        });
                    }
                }

                logger.log('📊 [API] Total unread notifications calculated:', totalUnread);
                setUnreadCount(totalUnread);
                lastFetchTime = Date.now();
                return totalUnread;
            } catch (error) {
                logger.error('❌ [API] Error fetching unread notifications count:', error);
                // Keep the current global unread count on error
                return unreadCount;
            } finally {
                setLoading(false);
                activeFetchPromise = null; // Reset promise tracker
            }
        })();

        return activeFetchPromise;
    };

    const markAsRead = (notificationId: string) => {
        // Optimistically update the count
        setUnreadCount(Math.max(0, unreadCount - 1));
    };

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    const refreshCount = () => {
        fetchUnreadCount(true); // Force refresh
    };

    useEffect(() => {
        fetchUnreadCount();
    }, [user?.id]);

    return {
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refreshCount,
    };
};

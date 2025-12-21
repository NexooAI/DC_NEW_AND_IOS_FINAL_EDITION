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

export const useUnreadNotifications = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const { user } = useGlobalStore();

    const fetchUnreadCount = async () => {
        if (!user?.id) {
            setUnreadCount(0);
            return;
        }

        try {
            setLoading(true);
            logger.log('🔔 Fetching unread notifications count for user:', user.id);

            const response = await userAPI.getNotifications(user.id);
            const data: NotificationResponse = response.data;

            logger.log('📊 Notifications API response for badge:', data);

            if (data && typeof data === "object" && !Array.isArray(data)) {
                // Count unread notifications across all categories
                let totalUnread = 0;
                Object.values(data).forEach((notifications) => {
                    if (Array.isArray(notifications)) {
                        const unreadInCategory = notifications.filter(
                            (notification) => notification.status === 'unread'
                        ).length;
                        totalUnread += unreadInCategory;
                    }
                });

                logger.log('📊 Total unread notifications:', totalUnread);
                setUnreadCount(totalUnread);
            } else {
                logger.log('📊 No notifications data or invalid format');
                setUnreadCount(0);
            }
        } catch (error) {
            logger.error('❌ Error fetching unread notifications count:', error);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = (notificationId: string) => {
        // Optimistically update the count
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setUnreadCount(0);
    };

    const refreshCount = () => {
        fetchUnreadCount();
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

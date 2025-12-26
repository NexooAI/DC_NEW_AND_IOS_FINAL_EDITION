import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated as RNAnimated,
  Platform,
} from "react-native";
import { ScrollView, Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
// Bypass type checking for Reanimated due to v4 export issues
const Reanimated = require("react-native-reanimated");
const Animated = Reanimated.default || Reanimated;
const { Layout, FadeOut } = Reanimated;

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";
// AppHeader is now handled by the layout wrapper
import { theme } from "@/constants/theme";
import { userAPI } from "@/services/api";
import useGlobalStore from "@/store/global.store";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

import { logger } from '@/utils/logger';
// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays === 0) {
    return "Today";
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
};

// Utility function to get category display name
const getCategoryDisplayName = (category: string): string => {
  const categoryMap: { [key: string]: string } = {
    rates: "Gold Rates",
    offers: "Special Offers",
    transactions: "Transactions",
    reminders: "Reminders",
    alerts: "Alerts",
    blogs: "Blog Posts",
    general: "General",
  };

  return (
    categoryMap[category] ||
    category.charAt(0).toUpperCase() + category.slice(1)
  );
};

// Types
interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  created_at: string;
  updated_at: string;
  status: "read" | "unread";
}

// API Response type - object with categorized notifications
type NotificationResponse = {
  [key: string]: Notification[];
};

// Components
const NotificationItem = React.memo(
  ({
    item,
    index,
    onPress,
    onDelete,
  }: {
    item: Notification;
    index: number;
    onPress: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    
    // Gradient colors based on type
    const getCategoryGradient = (type: string): [string, string, ...string[]] => {
      switch (type) {
        case "offer":
          return ["#FF512F", "#DD2476"];
        case "transaction":
          return ["#2196F3", "#21CBF3"];
        case "reminder":
          return ["#56ab2f", "#a8e063"];
        case "alert":
          return ["#FFC837", "#FF8008"];
        case "rate":
          return ["#8E2DE2", "#4A00E0"];
        case "blog":
          return ["#F2994A", "#F2C94C"];
        default:
          return ["#4facfe", "#00f2fe"];
      }
    };

    const getCategoryIcon = (type: string) => {
      switch (type) {
        case "offer":
          return "gift-outline";
        case "transaction":
          return "wallet-outline";
        case "reminder":
          return "calendar-outline";
        case "alert":
          return "alert-circle-outline";
        case "rate":
          return "trending-up-outline";
        case "blog":
          return "document-text-outline";
        default:
          return "notifications-outline";
      }
    };

    const isUnread = item.status === "unread";
    
    const renderRightActions = (progress: any, dragX: any) => {
      return (
        <TouchableOpacity
            style={{
                backgroundColor: '#FF4B4B',
                justifyContent: 'center',
                alignItems: 'center',
                width: 80,
                height: '100%',
                borderRadius: 16,
                marginBottom: 12,
                marginLeft: 10
            }}
            onPress={() => onDelete(item.id.toString())}
        >
            <Ionicons name="trash-outline" size={28} color="white" />
        </TouchableOpacity>
      );
    };

    return (
      <Animated.View 
        // entering={FadeIn.delay(index * 50).springify()} // Animation disabled due to import error
        layout={Layout.springify()}
        exiting={FadeOut}
      >
        <Swipeable renderRightActions={renderRightActions}>
            <Pressable
            onPress={() => onPress(item.id.toString())}
            style={({ pressed }) => ({
                flexDirection: "row",
                // Differentiation: Tinted background for unread, White for read
                backgroundColor: isUnread ? "#FFF5F6" : "white", 
                borderRadius: 16,
                marginBottom: 12,
                marginHorizontal: 2,
                padding: 16,
                // Differentiation: Stronger shadow for unread
                shadowColor: isUnread ? theme.colors.primary : "#999",
                shadowOffset: { width: 0, height: isUnread ? 4 : 2 },
                shadowOpacity: isUnread ? 0.2 : 0.08,
                shadowRadius: isUnread ? 8 : 4,
                elevation: isUnread ? 5 : 2,
                // Differentiation: Left border accent for unread
                borderLeftWidth: isUnread ? 4 : 0,
                borderLeftColor: theme.colors.primary,
                // Differentiation: Slight opacity for read items to make them recede
                opacity: isUnread ? 1 : 0.95,
                transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
            >
            {/* Icon Container with Gradient */}
            <LinearGradient
                colors={getCategoryGradient(item.type)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
                // Greyscale the icon slightly for read items? Optional, but let's keep it vibrant.
                opacity: isUnread ? 1 : 0.8
                }}
            >
                <Ionicons
                name={getCategoryIcon(item.type) as any}
                size={24}
                color="white"
                />
            </LinearGradient>

            <View style={{ flex: 1 }}>
                <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                }}
                >
                <Text
                    style={{
                    fontSize: moderateScale(15),
                    fontWeight: isUnread ? "700" : "500", // Bolder for unread
                    color: isUnread ? "#1a1a1a" : "#4b5563", // Darker black for unread, grayish for read
                    flex: 1,
                    marginRight: 8,
                    lineHeight: 22,
                    }}
                    numberOfLines={2}
                >
                    {item.title}
                </Text>
                
                {isUnread && (
                    <View
                    style={{
                        backgroundColor: "#FFE5E5",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 10,
                    }}
                    >
                    <Text style={{ fontSize: 10, color: theme.colors.primary, fontWeight: "bold" }}>NEW</Text>
                    </View>
                )}
                </View>

                <Text
                style={{
                    fontSize: moderateScale(13),
                    color: isUnread ? "#444" : "#6b7280", // Darker gray for unread body, lighter for read
                    lineHeight: 19,
                    marginBottom: 10,
                }}
                numberOfLines={2}
                >
                {item.message}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                <Text style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 4 }}>
                    {formatDate(item.created_at)}
                </Text>
                </View>
            </View>
            </Pressable>
        </Swipeable>
      </Animated.View>
    );
  }
);

const NotificationSection = React.memo(
  ({
    title,
    notifications,
    onNotificationPress,
    onNotificationDelete,
    baseIndex = 0,
  }: {
    title: string;
    notifications: Notification[];
    onNotificationPress: (id: string) => void;
    onNotificationDelete: (id: string) => void;
    baseIndex?: number;
  }) => (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: theme.colors.primary,
          marginBottom: 16,
          paddingHorizontal: 4,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          opacity: 0.8
        }}
      >
        {title}
      </Text>
      {notifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          index={baseIndex + index}
          item={notification}
          onPress={onNotificationPress}
          onDelete={onNotificationDelete}
        />
      ))}
    </View>
  )
);

// Notification Modal Component
const NotificationModal = ({
  visible,
  notification,
  onClose,
}: {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
}) => {
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Animated.View
            // entering={FadeIn.springify()} // Animation disabled due to import error
            layout={Layout.springify()}
            style={{
                backgroundColor: "white",
                borderRadius: 24,
                width: "100%",
                maxWidth: 400,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
                overflow: 'hidden'
            }}
        >
            {/* Header / Banner */}
             <LinearGradient
                colors={[theme.colors.primary, '#850111']}
                style={{ padding: 24, alignItems: 'center' }}
             >
                <View style={{
                    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)',
                    justifyContent: 'center', alignItems: 'center', marginBottom: 12
                }}>
                     <Ionicons name="notifications" size={30} color="white" />
                </View>
                 <Text style={{ fontSize: 20, fontWeight: "bold", color: "white", textAlign: "center" }}>
                    {notification.title}
                 </Text>
                 <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 4 }}>
                    {formatDate(notification.created_at)}
                 </Text>
                 
                <TouchableOpacity 
                    onPress={onClose} 
                    style={{ position: 'absolute', top: 16, right: 16, padding: 8 }}
                >
                    <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
             </LinearGradient>

            {/* Content */}
             <View style={{ padding: 24 }}>
                 <Text style={{ fontSize: 16, lineHeight: 26, color: "#333", textAlign: "left" }}>
                    {notification.message}
                 </Text>
                 
                 <TouchableOpacity
                    onPress={onClose}
                    style={{
                        marginTop: 24,
                        backgroundColor: "#f5f5f5",
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center"
                    }}
                 >
                     <Text style={{ fontSize: 16, fontWeight: "600", color: "#666" }}>Dismiss</Text>
                 </TouchableOpacity>
             </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// Main Component
export default function NotificationsScreen() {
  const { user } = useGlobalStore();
  const { refreshCount } = useUnreadNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categorizedNotifications, setCategorizedNotifications] =
    useState<NotificationResponse>({});
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  // Fetch notifications from API
  const fetchNotifications = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check if user is available
      if (!user?.id) {
        logger.error("❌ No user ID available for fetching notifications");
        setError("User not authenticated");
        return;
      }

      logger.log("🔔 Fetching notifications from API for user:", user.id);
      const response = await userAPI.getNotifications(user.id);
      logger.log("✅ Notifications API response:", response.data);
      logger.log("📊 Response type:", typeof response.data);
      const data: NotificationResponse = response.data;
      logger.log(
        "📊 Is object:",
        typeof data === "object" && !Array.isArray(data)
      );

      if (data && typeof data === "object" && !Array.isArray(data)) {
        // Store the categorized notifications
        setCategorizedNotifications(data);
        logger.log("📊 Categorized notifications:", data);

        // Flatten all notifications from different categories into a single array
        const allNotifications: Notification[] = [];
        Object.entries(data).forEach(([category, notifications]) => {
          if (Array.isArray(notifications)) {
            logger.log(
              `📋 Category '${category}': ${notifications.length} notifications`
            );
            allNotifications.push(...notifications);
          }
        });
        logger.log(
          "📊 Total flattened notifications:",
          allNotifications.length
        );
        setNotifications(allNotifications);

        // Check if all categories are empty
        const hasAnyNotifications = Object.values(data).some(
          (notifications) =>
            Array.isArray(notifications) && notifications.length > 0
        );

        if (!hasAnyNotifications) {
          logger.log("📭 All notification categories are empty");
          // Don't set error, just show empty state
        }
      } else {
        setError("Invalid response format");
        // Fallback to sample data if API fails
        setNotifications([
          {
            id: 1,
            title: "Special Diwali Offer",
            message:
              "Invest ₹1000 today and get ₹50 cashback on your first gold purchase! Limited time offer valid until Diwali.",
            type: "offer",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "unread",
          },
          {
            id: 2,
            title: "SIP Transaction Successful",
            message:
              "Your monthly SIP of ₹5,000 has been processed successfully. Gold units have been allocated to your portfolio.",
            type: "transaction",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: "unread",
          },
        ]);
      }
    } catch (error: any) {
      logger.error("Error fetching notifications:", error);
      setError(error.response?.data?.message || "Failed to load notifications");
      // Fallback to sample data on error
      setNotifications([
        {
          id: 1,
          title: "Special Diwali Offer",
          message:
            "Invest ₹1000 today and get ₹50 cashback on your first gold purchase! Limited time offer valid until Diwali.",
          type: "offer",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "unread",
        },
        {
          id: 2,
          title: "SIP Transaction Successful",
          message:
            "Your monthly SIP of ₹5,000 has been processed successfully. Gold units have been allocated to your portfolio.",
          type: "transaction",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: "unread",
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications when component mounts
  useEffect(() => {
    logger.log("🚀 NotificationsScreen mounted, fetching notifications...");
    fetchNotifications();
  }, [user?.id]); // Add user.id as dependency

  const markAsRead = async (id: string) => {
    try {
      logger.log(`🔔 Marking notification ${id} as read via PATCH...`);

      const notificationId = parseInt(id);

      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: "read" }
            : notification
        )
      );

      // Also update categorizedNotifications to reflect the change in UI
      setCategorizedNotifications((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((category) => {
          if (Array.isArray(updated[category])) {
            updated[category] = updated[category].map((notification) =>
              notification.id === notificationId
                ? { ...notification, status: "read" }
                : notification
            );
          }
        });
        return updated;
      });

      // Call API to mark as read using PATCH method
      const response = await userAPI.markNotificationAsRead(id);
      logger.log(
        `✅ Notification ${id} marked as read successfully:`,
        response.data
      );

      // Refresh the badge count
      refreshCount();
    } catch (error) {
      logger.error(`❌ Error marking notification ${id} as read:`, error);
      const notificationId = parseInt(id);
      // Revert local state if API fails
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: "unread" }
            : notification
        )
      );
      // Revert categorizedNotifications as well
      setCategorizedNotifications((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((category) => {
          if (Array.isArray(updated[category])) {
            updated[category] = updated[category].map((notification) =>
              notification.id === notificationId
                ? { ...notification, status: "unread" }
                : notification
            );
          }
        });
        return updated;
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      // Remove from local state immediately for better UX
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== parseInt(id))
      );

      // Call API to delete notification
      await userAPI.deleteNotification(id);
    } catch (error) {
      logger.error("Error deleting notification:", error);
      // Revert local state if API fails
      setNotifications((prev) => prev);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Update local state immediately for better UX
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          status: "read",
        }))
      );

      // Also update categorizedNotifications to reflect the change in UI
      setCategorizedNotifications((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((category) => {
          if (Array.isArray(updated[category])) {
            updated[category] = updated[category].map((notification) => ({
              ...notification,
              status: "read",
            }));
          }
        });
        return updated;
      });

      // Call API to mark all as read
      await userAPI.markAllNotificationsAsRead();

      // Refresh the badge count
      refreshCount();
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      // Revert local state if API fails - would need to refetch to get original state
      fetchNotifications();
    }
  };

  const handleNotificationPress = (id: string) => {
    logger.log(`👆 User clicked on notification ${id}`);
    const notification = notifications.find((n) => n.id === parseInt(id));
    if (notification) {
      logger.log(`📱 Opening modal for notification:`, {
        id: notification.id,
        title: notification.title,
        type: notification.type,
        status: notification.status,
      });
      setSelectedNotification(notification);
      setModalVisible(true);
      markAsRead(id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // Group notifications by category and date
  const groupedNotifications = Object.entries(categorizedNotifications).reduce(
    (
      acc: { [key: string]: { [date: string]: Notification[] } },
      [category, notifications]
    ) => {
      if (Array.isArray(notifications) && notifications.length > 0) {
        acc[category] = notifications.reduce(
          (dateAcc: { [date: string]: Notification[] }, notification) => {
            const date = formatDate(notification.created_at);
            if (!dateAcc[date]) {
              dateAcc[date] = [];
            }
            dateAcc[date].push(notification);
            return dateAcc;
          },
          {}
        );
      }
      return acc;
    },
    {}
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={['right', 'bottom', 'left']}>
      {/* Header Container */}
      <View style={{ 
          backgroundColor: 'white',
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
          zIndex: 10,
      }}>
        <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12, // Reduced from 16
        }}>
            <View>
                <Text style={{ 
                    fontSize: moderateScale(24), 
                    fontWeight: "800", 
                    color: theme.colors.primary,
                    letterSpacing: -0.5
                }}>
                    Notifications
                </Text>
                <Text style={{ fontSize: moderateScale(13), color: "#666", marginTop: 2 }}>
                    Stay updated with your activities
                </Text>
            </View>
            
            {unreadCount > 0 && (
                <LinearGradient
                    colors={[theme.colors.primary, '#E6B800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                        {unreadCount} NEW
                    </Text>
                </LinearGradient>
            )}
        </View>
      </View>

        {/* Scrollable Content */}
        <View style={{ flex: 1, backgroundColor: "#F8F9FA" }}>
            <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
                flexGrow: 1,
                paddingBottom: 80,
                paddingHorizontal: 20,
                paddingTop: 20,
            }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Loading State */}
          {loading && !refreshing && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 60,
              }}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
                Loading notifications...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Ionicons name="cloud-offline-outline" size={48} color="#ff6b6b" />
              <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => fetchNotifications()}
                style={{
                  marginTop: 20,
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notification Sections */}
          {!loading &&
            !error &&
            notifications.length > 0 &&
            Object.entries(groupedNotifications)
              .filter(([category, dateGroups]) =>
                Object.values(dateGroups).some((n) => n.length > 0)
              )
              .map(([category, dateGroups]) => (
                <View key={category} style={{ marginBottom: 24 }}>
                  <LinearGradient
                    colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0)']}
                    style={{ 
                        paddingVertical: 8, 
                        paddingHorizontal: 12, 
                        borderRadius: 8, 
                        marginBottom: 12,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}
                  >
                    <View style={{ width: 4, height: 16, backgroundColor: theme.colors.primary, borderRadius: 2, marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#666", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {getCategoryDisplayName(category)}
                    </Text>
                  </LinearGradient>

                  {Object.entries(dateGroups)
                    .filter(([_, n]) => n.length > 0)
                    .map(([date, notificationsForDate]) => (
                      <NotificationSection
                        key={`${category}-${date}`}
                        title={date}
                        notifications={notificationsForDate}
                        onNotificationPress={handleNotificationPress}
                        onNotificationDelete={deleteNotification}
                      />
                    ))}
                </View>
              ))}

          {/* Empty State */}
          {!loading &&
            !error &&
            (Object.keys(categorizedNotifications).length === 0 ||
              Object.values(categorizedNotifications).every(
                (n) => Array.isArray(n) && n.length === 0
              )) && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 60,
                }}
              >
                <View style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: 'rgba(133, 1, 17, 0.05)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                }}>
                    <Ionicons name="notifications-outline" size={60} color={theme.colors.primary} style={{ opacity: 0.5 }} />
                </View>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  No New Notifications
                </Text>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#666",
                    textAlign: "center",
                    maxWidth: "70%",
                    lineHeight: 22,
                  }}
                >
                  You're all caught up! Check back later for updates on your gold investments.
                </Text>
              </View>
            )}
        </ScrollView>
      </View>

        <NotificationModal
          visible={modalVisible}
          notification={selectedNotification}
          onClose={closeModal}
        />
    </SafeAreaView>
  );
}

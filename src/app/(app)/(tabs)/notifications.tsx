import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  Pressable,
  Animated,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
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
    onPress,
    onDelete,
  }: {
    item: Notification;
    onPress: (id: string) => void;
    onDelete: (id: string) => void;
  }) => {
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []);

    const getCategoryColor = (type: string) => {
      switch (type) {
        case "offer":
          return "#FF5722";
        case "transaction":
          return "#2196F3";
        case "reminder":
          return "#4CAF50";
        case "alert":
          return "#FFC107";
        case "rate":
          return "#9C27B0";
        case "blog":
          return "#FF9800";
        default:
          return "#2196F3";
      }
    };

    const getCategoryIcon = (type: string) => {
      switch (type) {
        case "offer":
          return "gift";
        case "transaction":
          return "wallet";
        case "reminder":
          return "calendar";
        case "alert":
          return "alert-circle";
        case "rate":
          return "trending-up";
        case "blog":
          return "document-text";
        default:
          return "notifications";
      }
    };

    // Unique design: colored left bar, shadow, bold unread, background color change
    const isUnread = item.status === "unread";
    return (
      <Animated.View style={{ opacity: fadeAnim }}>
        <Pressable
          onPress={() => onPress(item.id.toString())}
          style={{
            flexDirection: "row",
            backgroundColor: isUnread ? "#FFF7F0" : "#F6F6F6",
            borderRadius: 12,
            marginBottom: 14,
            shadowColor: isUnread ? getCategoryColor(item.type) : "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isUnread ? 0.18 : 0.08,
            shadowRadius: 6,
            elevation: isUnread ? 4 : 1,
          }}
        >
          {/* Colored left bar */}
          <View
            style={{
              width: 6,
              borderTopLeftRadius: 12,
              borderBottomLeftRadius: 12,
              backgroundColor: isUnread
                ? getCategoryColor(item.type)
                : "transparent",
            }}
          />
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 14,
                  backgroundColor: `${getCategoryColor(item.type)}10`,
                  flexShrink: 0,
                }}
              >
                <Ionicons
                  name={getCategoryIcon(item.type) as any}
                  size={22}
                  color={getCategoryColor(item.type)}
                />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
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
                      fontSize: 16,
                      fontWeight: isUnread ? "bold" : "600",
                      color: "#222",
                      flex: 1,
                      marginRight: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDelete(item.id.toString())}
                    style={{
                      padding: 6,
                      marginRight: -8,
                      flexShrink: 0,
                      alignSelf: "flex-start",
                    }}
                  >
                    {/* <Ionicons name="close" size={18} color="#9E9E9E" /> */}
                  </TouchableOpacity>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#555",
                    lineHeight: 20,
                    marginRight: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {item.message}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 10,
                    marginRight: 8,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      flex: 1,
                    }}
                  >
                    <Ionicons name="time-outline" size={14} color="#9E9E9E" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#888",
                        marginLeft: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      {formatDate(item.created_at)}
                    </Text>
                  </View>
                  {isUnread && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: getCategoryColor(item.type),
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    />
                  )}
                </View>
              </View>
            </View>
          </View>
        </Pressable>
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
  }: {
    title: string;
    notifications: Notification[];
    onNotificationPress: (id: string) => void;
    onNotificationDelete: (id: string) => void;
  }) => (
    <View style={{ marginTop: 24 }}>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: "#374151",
          marginBottom: 16,
          paddingHorizontal: 4,
        }}
      >
        {title}
      </Text>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
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

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "offer":
        return "#FF5722";
      case "transaction":
        return "#2196F3";
      case "reminder":
        return "#4CAF50";
      case "alert":
        return "#FFC107";
      case "rate":
        return "#9C27B0";
      case "blog":
        return "#FF9800";
      default:
        return "#2196F3";
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case "offer":
        return "gift";
      case "transaction":
        return "wallet";
      case "reminder":
        return "calendar";
      case "alert":
        return "alert-circle";
      case "rate":
        return "trending-up";
      case "blog":
        return "document-text";
      default:
        return "notifications";
    }
  };

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
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 400,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {/* Header with icon */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#f0f0f0",
            }}
          >
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${getCategoryColor(notification.type)}15`,
                marginRight: 16,
              }}
            >
              <Ionicons
                name={getCategoryIcon(notification.type) as any}
                size={24}
                color={getCategoryColor(notification.type)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#222",
                  marginBottom: 4,
                }}
              >
                {notification.title}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#888",
                }}
              >
                {formatDate(notification.created_at)}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Message */}
          <Text
            style={{
              fontSize: 16,
              color: "#444",
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            {notification.message}
          </Text>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: "#f0f0f0",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#888",
              }}
            >
              {formatDate(notification.created_at)}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: getCategoryColor(notification.type),
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ImageBackground
        source={theme.image.menu_bg as any}
        resizeMode="repeat"
        style={{ flex: 1 }}
        imageStyle={{
          width: "100%",
          height: "100%",
          resizeMode: "repeat" as any,
          opacity: 0.02,
        }}
      >
        {/* Fixed Header */}
        {/* Header is now handled by the layout wrapper */}

        {/* Scrollable Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 80,
            paddingHorizontal: 20,
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
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            <View style={{ flex: 1, marginRight: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: "#1f2937",
                  }}
                >
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View
                    style={{
                      marginLeft: 12,
                      backgroundColor: "#ef4444",
                      borderRadius: 12,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      minWidth: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 12,
                        fontWeight: "500",
                      }}
                    >
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                }}
              >
                Stay updated with your Digi Gold activities
              </Text>
            </View>
            {/* <TouchableOpacity
              onPress={markAllAsRead}
              style={{
                backgroundColor: "#f3f4f6",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  color: "#374151",
                  fontWeight: "500",
                  fontSize: 14,
                }}
              >
                Mark All as Read
              </Text>
            </TouchableOpacity> */}
          </View>

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
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: "#666",
                  textAlign: "center",
                }}
              >
                Loading notifications...
              </Text>
            </View>
          )}

          {/* Error State */}
          {error && !loading && (
            <View
              style={{
                paddingVertical: 40,
                alignItems: "center",
              }}
            >
              <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
              <Text
                style={{
                  marginTop: 16,
                  fontSize: 16,
                  color: "#666",
                  textAlign: "center",
                  marginBottom: 20,
                }}
              >
                {error}
              </Text>
              <TouchableOpacity
                onPress={() => fetchNotifications()}
                style={{
                  backgroundColor: theme.colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Notification Sections by Category */}
          {!loading &&
            !error &&
            notifications.length > 0 &&
            Object.entries(groupedNotifications)
              .filter(([category, dateGroups]) =>
                Object.values(dateGroups).some(
                  (notifications) => notifications.length > 0
                )
              )
              .map(([category, dateGroups]) => (
                <View key={category} style={{ marginBottom: 32 }}>
                  {/* Category Header */}
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#1f2937",
                      marginBottom: 16,
                      paddingHorizontal: 4,
                    }}
                  >
                    {getCategoryDisplayName(category)}
                  </Text>

                  {/* Notifications for this category grouped by date */}
                  {Object.entries(dateGroups)
                    .filter(
                      ([date, notificationsForDate]) =>
                        notificationsForDate.length > 0
                    )
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
                (notifications) =>
                  Array.isArray(notifications) && notifications.length === 0
              )) && (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 60,
                }}
              >
                <Ionicons name="notifications-off" size={64} color="#ccc" />
                <Text
                  style={{
                    marginTop: 16,
                    fontSize: 18,
                    color: "#666",
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  No notifications yet
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#999",
                    textAlign: "center",
                  }}
                >
                  You'll see important updates here when they arrive
                </Text>
              </View>
            )}
        </ScrollView>

        {/* Notification Modal */}
        <NotificationModal
          visible={modalVisible}
          notification={selectedNotification}
          onClose={closeModal}
        />
      </ImageBackground>
    </SafeAreaView>
  );
}

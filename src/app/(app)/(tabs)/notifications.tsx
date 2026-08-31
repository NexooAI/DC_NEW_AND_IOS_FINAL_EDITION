import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";
import { theme } from "@/constants/theme";
import api, { userAPI } from "@/services/api";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppVisibility } from "@/hooks/useAppVisibility";
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

// Regex rates parser
const parseRates = (message: string) => {
  const getMatch = (regexes: RegExp[]) => {
    for (const regex of regexes) {
      const match = message.match(regex);
      if (match) return match[1];
    }
    return null;
  };

  const k22 = getMatch([
    /22\s*[kK]\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/,
    /22\s*Carat\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
    /22\s*ct\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
  ]);

  const k18 = getMatch([
    /18\s*[kK]\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/,
    /18\s*Carat\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
    /18\s*ct\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
  ]);

  const k14 = getMatch([
    /14\s*[kK]\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/,
    /14\s*Carat\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
    /14\s*ct\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
  ]);

  const silver = getMatch([
    /silver\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
    /வெள்ளி\s*:?\s*(?:₹|Rs\.?)?\s*([\d,]+)/i,
  ]);

  return { k22, k18, k14, silver };
};

// Colors mapping helper for notifications category
const getCategoryColors = (type: string) => {
  switch (type.toLowerCase()) {
    case "offer":
    case "offers":
      return {
        border: "#DD2476",
        bg: "#FFF0F5",
        iconBg: ["#FF512F", "#DD2476"] as [string, string, ...string[]],
      };
    case "transaction":
    case "transactions":
      return {
        border: "#2196F3",
        bg: "#E3F2FD",
        iconBg: ["#2196F3", "#21CBF3"] as [string, string, ...string[]],
      };
    case "reminder":
    case "reminders":
      return {
        border: "#56ab2f",
        bg: "#F1F8E9",
        iconBg: ["#56ab2f", "#a8e063"] as [string, string, ...string[]],
      };
    case "alert":
    case "alerts":
      return {
        border: "#FF8008",
        bg: "#FFF8E1",
        iconBg: ["#FFC837", "#FF8008"] as [string, string, ...string[]],
      };
    case "rate":
    case "rates":
      return {
        border: "#D4AF37", // Gold
        bg: "#FFFDF0",
        iconBg: ["#FFD700", "#D4AF37"] as [string, string, ...string[]],
      };
    case "blog":
    case "blogs":
      return {
        border: "#F2994A",
        bg: "#FFF3E0",
        iconBg: ["#F2994A", "#F2C94C"] as [string, string, ...string[]],
      };
    default:
      return {
        border: "#850111",
        bg: "#FFF5F6",
        iconBg: ["#4facfe", "#00f2fe"] as [string, string, ...string[]],
      };
  }
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

// Redesigned Standalone Notification Card Component
const NotificationItem = React.memo(
  ({
    item,
    index,
    onPress,
    onDelete,
    showSilver,
    liveRates,
  }: {
    item: Notification;
    index: number;
    onPress: (id: string) => void;
    onDelete: (id: string) => void;
    showSilver: boolean;
    liveRates: any;
  }) => {
    const isUnread = item.status === "unread";
    const categoryColors = getCategoryColors(item.type);
    const isRateType = item.type?.toLowerCase() === "rate" || item.type?.toLowerCase() === "rates";

    const getCategoryIcon = (type: string) => {
      switch (type.toLowerCase()) {
        case "offer":
        case "offers":
          return "gift-outline";
        case "transaction":
        case "transactions":
          return "wallet-outline";
        case "reminder":
        case "reminders":
          return "calendar-outline";
        case "alert":
        case "alerts":
          return "alert-circle-outline";
        case "rate":
        case "rates":
          return "trending-up-outline";
        case "blog":
        case "blogs":
          return "document-text-outline";
        default:
          return "notifications-outline";
      }
    };

    const renderRightActions = () => {
      return (
        <TouchableOpacity
          style={{
            backgroundColor: '#FF4B4B',
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            height: '85%',
            alignSelf: 'center',
            borderRadius: 16,
            marginRight: 4,
          }}
          onPress={() => onDelete(item.id.toString())}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </TouchableOpacity>
      );
    };

    // Layout for Rate Notifications
    const renderRateLayout = () => {
      const parsed = parseRates(item.message);
      // Fallback hierarchy: parsed from text -> live API -> standard placeholders
      const k22 = parsed.k22 || liveRates?.gold_rate || "14,650";
      const k18 = parsed.k18 || liveRates?.gold_rate_18 || "12,224";
      const k14 = parsed.k14 || liveRates?.gold_rate_14 || "9,372";
      const silver = parsed.silver || liveRates?.silver_rate || "95";

      return (
        <View style={{ width: '100%' }}>
          {/* Header Row */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#FEF3C7',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10
            }}>
              <Ionicons name="trending-up" size={18} color="#D4AF37" />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F1D3A", flex: 1 }}>
              {item.title}
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 12 }}>
            {item.message}
          </Text>

          {/* Rates Display Grid */}
          <View style={{
            backgroundColor: '#FFFDF0',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#FEF08A',
            paddingVertical: 12,
            paddingHorizontal: 8,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            marginBottom: 12,
          }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#854D0E', marginBottom: 2 }}>22K</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F1D3A' }}>₹{k22}/g</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#FEF08A' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#854D0E', marginBottom: 2 }}>18K</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F1D3A' }}>₹{k18}/g</Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#FEF08A' }} />
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#854D0E', marginBottom: 2 }}>14K</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F1D3A' }}>₹{k14}/g</Text>
            </View>
            {showSilver && (
              <>
                <View style={{ width: 1, height: 24, backgroundColor: '#FEF08A' }} />
                <View style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#854D0E', marginBottom: 2 }}>Silver</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F1D3A' }}>₹{silver}/g</Text>
                </View>
              </>
            )}
          </View>

          {/* Footer Actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={13} color="#9CA3AF" />
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#D4AF37', marginRight: 4 }}>
                View Gold Rates
              </Text>
              <Ionicons name="arrow-forward" size={14} color="#D4AF37" />
            </View>
          </View>
        </View>
      );
    };

    // Layout for general notifications (Offers, Reminders, Transactions)
    const renderGeneralLayout = () => {
      return (
        <View style={{ flexDirection: "row", alignItems: "flex-start", width: '100%' }}>
          {/* Left Category Icon with Gradient */}
          <LinearGradient
            colors={categoryColors.iconBg}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              marginTop: 2,
            }}
          >
            <Ionicons
              name={getCategoryIcon(item.type) as any}
              size={18}
              color="white"
            />
          </LinearGradient>

          {/* Card Body */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: moderateScale(14),
                fontWeight: "700",
                color: "#0F1D3A",
                marginBottom: 6,
                lineHeight: 20,
              }}
              numberOfLines={2}
            >
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: moderateScale(12),
                color: "#6B7280",
                lineHeight: 18,
                marginBottom: 10,
              }}
              numberOfLines={3}
            >
              {item.message}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="time-outline" size={13} color="#9CA3AF" />
              <Text style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 4 }}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      );
    };

    return (
      <View style={{ marginBottom: 12 }}>
        <Pressable
          onPress={() => onPress(item.id.toString())}
          style={({ pressed }) => ({
            backgroundColor: "white",
            padding: 16,
            borderRadius: 16,
            // Shadow for card styling
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            elevation: 2,
            borderWidth: 1,
            borderColor: isUnread ? '#FEF08A' : '#F3F4F6',
            // Dynamic left border accent for unread items
            borderLeftWidth: 4,
            borderLeftColor: categoryColors.border,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          {/* Unread "NEW" Tag */}
          {isUnread && (
            <View style={{
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 20,
              alignSelf: "flex-start",
              marginBottom: 8,
            }}>
              <Text style={{ fontSize: 9, color: '#854D0E', fontWeight: "800" }}>NEW</Text>
            </View>
          )}

          {isRateType ? renderRateLayout() : renderGeneralLayout()}
        </Pressable>
      </View>
    );
  }
);

// Main Notifications Screen Redesign
export default function NotificationsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user } = useGlobalStore();
  const { isVisible } = useAppVisibility();
  const { refreshCount } = useUnreadNotifications();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categorizedNotifications, setCategorizedNotifications] = useState<NotificationResponse>({});
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [liveRates, setLiveRates] = useState<any>(null);

  const showSilver = isVisible("showSilverRate");
  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const filterOptions = [
    { label: "Gold Rates", value: "rates", icon: "trending-up-outline" },
    { label: "All", value: "all", icon: "grid-outline" },
    { label: "Offers", value: "offers", icon: "gift-outline" },
    { label: "Rewards", value: "rewards", icon: "trophy-outline" },
  ];

  // Fetch Fallback Gold & Silver Rates from API (Checking both /home and /rates with separate try-catch)
  const fetchLiveRates = async () => {
    try {
      let ratesData: any = {};

      // 1. Fetch from /home (passing userId to avoid 400 Bad Request)
      if (user?.id) {
        try {
          const homeResponse = await api.get(`/home?userId=${user.id}`, { skipLoading: true } as any);
          if (homeResponse.data?.data?.currentRates) {
            ratesData = { ...homeResponse.data.data.currentRates };
          }
        } catch (homeError) {
          logger.error("Error fetching live rates from /home:", homeError);
        }
      }

      // 2. Fetch from /rates to double check or fill in missing rates (especially silver_rate)
      try {
        const ratesResponse = await api.get('/rates', { skipLoading: true } as any);
        if (ratesResponse.data?.data && ratesResponse.data.data.length > 0) {
          const sortedRates = [...ratesResponse.data.data].sort((a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const latestRate = sortedRates[0];
          if (latestRate) {
            ratesData = {
              ...ratesData,
              gold_rate: ratesData.gold_rate || latestRate.gold_rate,
              silver_rate: ratesData.silver_rate || latestRate.silver_rate,
            };
          }
        }
      } catch (ratesError) {
        logger.error("Error fetching live rates from /rates:", ratesError);
      }

      if (Object.keys(ratesData).length > 0) {
        setLiveRates(ratesData);
      }
    } catch (e) {
      logger.error("Error in fetchLiveRates fallback:", e);
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async (isRefresh = false) => {
    try {
      setError(null);
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!user?.id) {
        logger.error("❌ No user ID available for fetching notifications");
        setError("User not authenticated");
        return;
      }

      logger.log("🔔 Fetching notifications from API for user:", user.id);
      const response = await api.get(`/notifications/${user.id}`);
      logger.log("✅ Notifications API response:", response.data);

      const responseData = response.data;
      let notificationsList: Notification[] = [];
      let categorizedData: NotificationResponse = {};

      if (responseData) {
        let rawNotifications: any = null;

        if (Array.isArray(responseData)) {
          rawNotifications = responseData;
        } else if (responseData.success && Array.isArray(responseData.data)) {
          rawNotifications = responseData.data;
        } else if (responseData.data && typeof responseData.data === 'object') {
          rawNotifications = responseData.data;
        } else if (typeof responseData === 'object') {
          rawNotifications = responseData;
        }

        if (Array.isArray(rawNotifications)) {
          notificationsList = rawNotifications;
          rawNotifications.forEach((n: Notification) => {
            const cat = n.type || "general";
            if (!categorizedData[cat]) {
              categorizedData[cat] = [];
            }
            categorizedData[cat].push(n);
          });
        } else if (rawNotifications && typeof rawNotifications === 'object' && !Array.isArray(rawNotifications)) {
          categorizedData = rawNotifications;
          Object.entries(rawNotifications).forEach(([category, list]) => {
            if (Array.isArray(list)) {
              notificationsList.push(...list);
            }
          });
        }
      }

      setCategorizedNotifications(categorizedData);
      setNotifications(notificationsList);
    } catch (error: any) {
      logger.error("Error fetching notifications:", error);
      setError(error.response?.data?.message || "Failed to load notifications");
      setNotifications([]);
      setCategorizedNotifications({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchLiveRates();
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      const notificationId = parseInt(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, status: "read" } : notification
        )
      );

      await userAPI.markNotificationAsRead(id);
      refreshCount();
    } catch (error) {
      logger.error(`Error marking notification ${id} as read:`, error);
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== parseInt(id)));
      await userAPI.deleteNotification(id);
    } catch (error) {
      logger.error("Error deleting notification:", error);
      fetchNotifications();
    }
  };

  const handleNotificationPress = (id: string) => {
    const notification = notifications.find((n) => n.id === parseInt(id));
    if (notification) {
      setSelectedNotification(notification);
      setModalVisible(true);
      markAsRead(id);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNotification(null);
  };

  // Filter notifications by Active Chip
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const type = item.type?.toLowerCase() || "";
      if (activeFilter === "all") return true;
      if (activeFilter === "rates") return type === "rate" || type === "rates";
      if (activeFilter === "offers") return type === "offer" || type === "offers";
      if (activeFilter === "rewards") return type === "reward" || type === "rewards";
      return true;
    });
  }, [notifications, activeFilter]);

  // Group filtered notifications by Date
  const groupedByDate = useMemo(() => {
    return filteredNotifications.reduce((acc: { [date: string]: Notification[] }, n) => {
      const date = formatDate(n.created_at);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(n);
      return acc;
    }, {});
  }, [filteredNotifications]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#FCFBF7', // Cream background from mockup
        }}
        edges={['top', 'left', 'right']}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FCFBF7" />

        {/* Premium Header Layout */}
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          backgroundColor: '#FCFBF7',
        }}>
          {/* Back Arrow */}
          <TouchableOpacity onPress={() => router.push("/(app)/(tabs)/home")} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#0F1D3A" />
          </TouchableOpacity>

          {/* Centered serif title with gold indicator underline */}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={{
                fontSize: moderateScale(20),
                fontWeight: "800",
                color: "#0F1D3A", // Dark navy title
                fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              }}>
                Notifications
              </Text>
              {/* Thick gold underline left-aligned */}
              <View style={{
                width: 44,
                height: 3,
                backgroundColor: '#D4AF37',
                marginTop: 4,
              }} />
            </View>
          </View>

          {/* Floating Bell Button with Gold Badge */}
          <TouchableOpacity
            onPress={() => router.push("/test-notifications")} // Direct routing placeholder or settings
            style={{
              width: 46,
              height: 46,
              borderRadius: 23,
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 5,
              elevation: 4,
            }}
          >
            <Ionicons name="notifications-outline" size={22} color="#0F1D3A" />
            {unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -3,
                right: -3,
                backgroundColor: '#D4AF37',
                borderRadius: 10,
                paddingHorizontal: 4,
                minWidth: 18,
                height: 18,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1.5,
                borderColor: 'white'
              }}>
                <Text style={{ color: "white", fontWeight: "800", fontSize: 9 }}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter Chips Scrollbar */}
        <View style={{ paddingVertical: 12, backgroundColor: '#FCFBF7' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              gap: 8,
            }}
          >
            {filterOptions.map((option) => {
              const isSelected = activeFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setActiveFilter(option.value)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: isSelected ? '#D4AF37' : '#E5E7EB',
                    backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.08)' : 'white',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: isSelected ? 0.02 : 0.01,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={15}
                    color={isSelected ? '#D4AF37' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: isSelected ? '700' : '500',
                      color: isSelected ? '#D4AF37' : '#6B7280',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main List */}
        <View style={{ flex: 1, backgroundColor: '#FAF9F5' }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => fetchNotifications(true)}
                colors={['#D4AF37']}
                tintColor="#D4AF37"
              />
            }
          >
            {/* Loading */}
            {loading && !refreshing && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 80 }}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={{ marginTop: 16, fontSize: 14, color: "#666" }}>
                  Loading notifications...
                </Text>
              </View>
            )}

            {/* Error */}
            {error && !loading && (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Ionicons name="cloud-offline-outline" size={48} color="#FF4B4B" />
                <Text style={{ marginTop: 16, fontSize: 14, color: "#666" }}>{error}</Text>
                <TouchableOpacity
                  onPress={() => fetchNotifications()}
                  style={{
                    marginTop: 20,
                    backgroundColor: '#D4AF37',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700" }}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Notifications Grouped by Date */}
            {!loading && !error && filteredNotifications.length > 0 && (
              Object.entries(groupedByDate).map(([date, items]) => (
                <View key={date} style={{ marginBottom: 20 }}>
                  {/* Date Heading */}
                  <Text style={{
                    fontSize: 11,
                    fontWeight: "800",
                    color: "#9CA3AF",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}>
                    {date}
                  </Text>
                  
                  {/* Render Standalone Cards */}
                  {items.map((item, idx) => (
                    <NotificationItem
                      key={item.id}
                      index={idx}
                      item={item}
                      onPress={handleNotificationPress}
                      onDelete={deleteNotification}
                      showSilver={showSilver}
                      liveRates={liveRates}
                    />
                  ))}
                </View>
              ))
            )}

            {/* Empty State */}
            {!loading && !error && filteredNotifications.length === 0 && (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 80 }}>
                <View style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: 'rgba(212, 175, 55, 0.06)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Ionicons name="notifications-off-outline" size={44} color="#D4AF37" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "#0F1D3A", marginBottom: 6 }}>
                  No Notifications
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center", maxWidth: "80%", lineHeight: 20 }}>
                  You don't have any notifications in this section. We will notify you when new rates or offers are live.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Detail Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}>
            <View style={{
              backgroundColor: "white",
              borderRadius: 24,
              width: "100%",
              maxWidth: 380,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 10,
              overflow: 'hidden'
            }}>
              {/* Modal Banner */}
              <LinearGradient
                colors={['#0F1D3A', '#850111']}
                style={{ padding: 24, alignItems: 'center' }}
              >
                <View style={{
                  width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center', alignItems: 'center', marginBottom: 12
                }}>
                  <Ionicons name="notifications" size={24} color="white" />
                </View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: "white", textAlign: "center" }}>
                  {selectedNotification?.title}
                </Text>
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                  {selectedNotification && formatDate(selectedNotification.created_at)}
                </Text>
                <TouchableOpacity
                  onPress={closeModal}
                  style={{ position: 'absolute', top: 16, right: 16 }}
                >
                  <Ionicons name="close-circle" size={26} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </LinearGradient>

              {/* Modal Body */}
              <View style={{ padding: 24 }}>
                <Text style={{ fontSize: 14, lineHeight: 22, color: "#374151" }}>
                  {selectedNotification?.message}
                </Text>
                
                <TouchableOpacity
                  onPress={closeModal}
                  style={{
                    backgroundColor: '#0F1D3A',
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    marginTop: 24,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "white" }}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

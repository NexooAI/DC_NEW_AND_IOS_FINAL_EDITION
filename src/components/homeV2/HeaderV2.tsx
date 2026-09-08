import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { moderateScale } from "react-native-size-matters";
import LanguageSelector from "@/components/LanguageSelector";

interface HeaderV2Props {
  onNotificationPress?: () => void;
  onMenuPress?: () => void;
  onLanguagePress?: () => void;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({
  onNotificationPress,
  onMenuPress,
  onLanguagePress,
}) => {
  const theme = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { unreadCount } = useUnreadNotifications();
  const { user } = useGlobalStore();
  const appConfig = getAppConfig();
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleLanguagePress = () => {
    if (onLanguagePress) {
      onLanguagePress();
    } else {
      setLanguageModalVisible(true);
    }
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      router.push("/(app)/(tabs)/notifications");
    }
  };

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      navigation.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left / Center Branding: Logo + Name + Tagline */}
      <View style={styles.brandContainer}>
        <Image
          source={require("../../../assets/images/logo_trans.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {appConfig.constants.customerName || "SURESH FASHION JEWELLERY"}
          </Text>
          <Text style={styles.brandTagline}>Generations of Trust</Text>
        </View>
      </View>

      {/* Right Icons: Language, Notifications & Menu */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleLanguagePress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="language" size={20} color="#1E293B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={22} color="#1E293B" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleMenuPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="menu" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <LanguageSelector
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(14),
    paddingTop: Platform.OS === "android" ? moderateScale(8) : moderateScale(4),
    paddingBottom: moderateScale(10),
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.04)",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: moderateScale(6),
  },
  logo: {
    width: moderateScale(38),
    height: moderateScale(38),
    marginRight: moderateScale(8),
  },
  brandTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  brandTitle: {
    fontSize: moderateScale(12.5),
    fontWeight: "800",
    color: "#003C28", // Rich emerald brand primary
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  brandTagline: {
    fontSize: moderateScale(10),
    color: "#C59B27", // Warm Gold
    fontWeight: "600",
    fontStyle: "italic",
    marginTop: -1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    flexShrink: 0,
  },
  iconButton: {
    width: moderateScale(35),
    height: moderateScale(35),
    borderRadius: moderateScale(17.5),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#DC2626", // Vivid Red
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },
});

export default HeaderV2;

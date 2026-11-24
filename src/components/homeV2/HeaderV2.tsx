import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { moderateScale } from "react-native-size-matters";
import LanguageSelector from "@/components/LanguageSelector";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
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
      (navigation as any).openDrawer?.();
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* Left / Center Branding: Logo + Name + Tagline */}
      <View style={styles.brandContainer}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.brandTextContainer}>
          <Text style={styles.brandTitle} numberOfLines={1}>
            {appConfig.constants.customerName || "Sri Murugan Gold House"}
          </Text>
          <Text style={styles.brandTagline}>
            {t("generationsOfTrust", { defaultValue: "தலைமுறை தலைமுறையாய் உங்கள் நம்பிக்கை" })}
          </Text>
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
          <Ionicons name="language" size={19} color="#FFDF00" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
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
          <Ionicons name="menu" size={22} color="#FFFFFF" />
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
    backgroundColor: "#850111", // Royal Temple Burgundy
    borderBottomWidth: 1.5,
    borderBottomColor: "#D4AF37", // Sacred Gold Border
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
    fontSize: moderateScale(13),
    fontWeight: "800",
    color: "#FFFFFF", // Crisp White for High Royal Contrast
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  brandTagline: {
    fontSize: moderateScale(10),
    color: "#FFDF00", // Radiant Temple Gold
    fontWeight: "700",
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
    backgroundColor: "rgba(255, 255, 255, 0.16)", // Translucent Royal Frosted Glass
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#F59E0B", // Bright Amber Gold
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#850111",
  },
  badgeText: {
    color: "#850111", // Maroon text on Gold Badge
    fontSize: 9,
    fontWeight: "800",
  },
});

export default HeaderV2;

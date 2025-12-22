import React, { useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  TouchableOpacity,
  Linking,
  Alert,
  Text,
  View,
  Platform,
  Animated,
  StyleSheet,
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";
import { t } from "@/i18n";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";


const CompactContactButton: React.FC<{
  icon: string;
  label: string;
  onPress: () => void;
  color: string;
}> = ({ icon, label, onPress, color }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.compactButton}
    >
      <Animated.View
        style={[
          styles.compactButtonContent,
          {
            backgroundColor: color,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons name={icon as any} size={20} color="#fff" />
        <Text style={styles.compactButtonLabel} numberOfLines={1}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const SupportContactCard = () => {
  const {
    deviceScale,
    getResponsiveFontSize,
    screenWidth,
  } = useResponsiveLayout();

  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenDialer"))
    );
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${theme.constants.email}`).catch((err) =>
      Alert.alert(t("error"), t("couldNotOpenEmail"))
    );
  };

  const handleWhatsApp = async () => {
    const phoneNumber = theme.constants.whatsapp.replace(/[^\d]/g, "");
    const text = "Hello, I need support.";
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${text}`;
    const webUrl = `https://wa.me/${phoneNumber}?text=${text}`;

    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      // If checking support creates an error, try opening web url directly
      Linking.openURL(webUrl).catch((err) =>
        Alert.alert(t("error"), t("couldNotOpenWhatsApp"))
      );
    }
  };

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={["#850111", "#3A0F14", "#0E0E0E"]}
        style={styles.mainGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={[theme.colors.secondary, "#FFD700"]}
              style={styles.mainIconContainer}
            >
              <MaterialIcons
                name="support-agent"
                size={deviceScale(22)}
                color={theme.colors.primary}
              />
            </LinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={styles.mainTitle}>{t("supportTitle")}</Text>
            </View>
          </View>
        </View>

        {/* Contact Buttons Row */}
        <View style={styles.contactButtonsRow}>
          <CompactContactButton
            icon="call"
            label={t("call") || "Call"}
            onPress={handleCall}
            color={theme.colors.info}
          />
          <CompactContactButton
            icon="mail"
            label={t("email") || "Email"}
            onPress={handleEmail}
            color="#4ECDC4"
          />
          <CompactContactButton
            icon="logo-whatsapp"
            label={t("whatsapp") || "WhatsApp"}
            onPress={handleWhatsApp}
            color="#25D366"
          />
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(8),
    width: "100%",
  },
  mainGradient: {
    borderRadius: moderateScale(16),
    padding: moderateScale(14),
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: `rgba(255,201,12,0.2)`,
    overflow: "hidden",
  },
  headerRow: {
    marginBottom: moderateScale(12),
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  mainIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(10),
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  mainTitle: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  contactButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: moderateScale(8),
  },
  compactButton: {
    flex: 1,
  },
  compactButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
    borderRadius: moderateScale(12),
    gap: moderateScale(6),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  compactButtonLabel: {
    color: "#fff",
    fontSize: moderateScale(12),
    fontWeight: "600",
    flex: 1,
  },
});

export default SupportContactCard;

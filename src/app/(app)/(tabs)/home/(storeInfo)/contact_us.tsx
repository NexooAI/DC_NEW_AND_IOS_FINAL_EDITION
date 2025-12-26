import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  ImageBackground,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { theme } from "@/constants/theme";

const ContactUs = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`);
  };

  const handleWhatsApp = () => {
    const message = t("contactUsMessage") || "Hello, I would like to know more about your services.";
    const url = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${theme.constants.whatsapp || theme.constants.mobile}`;
    Linking.openURL(url).catch(() => {
      // Fallback for when WhatsApp is not installed
      Linking.openURL(`https://wa.me/${theme.constants.whatsapp || theme.constants.mobile}?text=${encodeURIComponent(message)}`);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${theme.constants.email}`);
  };

  const openGoogleMaps = () => {
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${10.519306421007363},${76.22348998262478}`;
    const label = "DC Jewellers";
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) {
        Linking.openURL(url);
    }
  };

  const openWebsite = () => {
    Linking.openURL(theme.constants.website);
  };

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={require("../../../../../../assets/images/shop.jpg")}
              style={styles.heroImage}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
                style={styles.heroGradient}
              >
                <Text style={styles.heroTitle}>{t("getInTouch")}</Text>
                <Text style={styles.heroSubtitle}>{t("contactUsSubtitle")}</Text>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCall}
              activeOpacity={0.8}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}
              >
                <Ionicons name="call" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.actionText}>{t("callNow")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWhatsApp}
              activeOpacity={0.8}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}
              >
                <FontAwesome5 name="whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.actionText}>{t("whatsApp")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={openGoogleMaps}
              activeOpacity={0.8}
            >
              <View
                style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}
              >
                <FontAwesome5
                  name="map-marker-alt"
                  size={24}
                  color="#F57C00"
                />
              </View>
              <Text style={styles.actionText}>{t("maps")}</Text>
            </TouchableOpacity>
          </View>

          {/* Website Section */}
          <View style={styles.websiteContainer}>
            <Text style={styles.websiteTitle}>{t("visitWebsite")}</Text>
            <TouchableOpacity
              style={styles.websiteButton}
              onPress={openWebsite}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[theme.colors.primary, "#D4AF37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.websiteGradient}
              >
                <FontAwesome5 name="globe" size={24} color="white" />
                <Text style={styles.websiteText}>
                  {theme.constants.website.replace(/^https?:\/\//, "")}
                </Text>
                <Feather name="external-link" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Business Hours */}
          <View style={styles.hoursContainer}>
            <Text style={styles.hoursTitle}>{t("businessHours")}</Text>
            <View style={styles.hourRow}>
              <Text style={styles.dayText}>{t("monSat")}</Text>
              <Text style={styles.timeText}>9:30 AM - 7:00 PM</Text>
            </View>
            <View style={[styles.hourRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.dayText, { color: theme.colors.primary }]}>
                {t("sunday")}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.primary }]}>
                {t("closed")}
              </Text>
            </View>
          </View>

          {/* Company Info */}
          <View style={styles.companyContainer}>
            <Text style={styles.companyTitle}>DC JEWELLERS</Text>
            <Text style={styles.companySubtitle}>Since 2020</Text>
            <Text style={styles.companyAddress}>
              {theme.constants.address}
            </Text>
          </View>
        </ScrollView>
      </View>
    </AppLayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    height: 240,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 24,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 24,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 22,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.textDarkGrey,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  websiteContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  websiteTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textDarkGrey,
    marginBottom: 16,
    marginLeft: 4,
  },
  websiteButton: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  websiteGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  websiteText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 12,
  },
  hoursContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  hoursTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.textDarkGrey,
    marginBottom: 20,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#666",
  },
  timeText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  companyContainer: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(133, 1, 17, 0.03)", // Very light primary tint
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(133, 1, 17, 0.05)",
  },
  companyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#888",
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  companyAddress: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "80%",
  },
});

export default ContactUs;

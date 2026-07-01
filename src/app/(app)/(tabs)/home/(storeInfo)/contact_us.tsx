import { useAppTheme } from "@/store/global.store";
import React, { useEffect, useState } from "react";
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
import api from "@/services/api";
import { getFullImageUrl } from "@/utils/imageUtils";
import { fetchAboutPageWithCache } from "@/utils/apiCache";

const ContactUs = () => {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const { t } = useTranslation();
  const router = useRouter();
  const [aboutData, setAboutData] = useState<any>(null);
  const [is24Hour, setIs24Hour] = useState(false);

  const parseAndFormatTime = (timePart: string, to24: boolean): string => {
    if (!timePart) return "";
    timePart = timePart.trim();
    if (timePart.toLowerCase() === "closed") return t("closed") || timePart;
    
    // Regex to match 12-hour format: e.g., "9:30 AM", "09:30 PM", "9 AM", "12:00 PM"
    const twelveHourRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i;
    // Regex to match 24-hour format: e.g., "09:30", "19:00", "9:30"
    const twentyFourHourRegex = /^(\d{1,2}):(\d{2})$/;

    if (to24) {
      // Convert to 24-hour format (e.g. "19:00")
      const match12 = timePart.match(twelveHourRegex);
      if (match12) {
        let hours = parseInt(match12[1], 10);
        const minutes = match12[2] || "00";
        const ampm = match12[3].toLowerCase();

        if (ampm === "pm" && hours < 12) {
          hours += 12;
        } else if (ampm === "am" && hours === 12) {
          hours = 0;
        }
        return `${String(hours).padStart(2, "0")}:${minutes}`;
      }
      const match24 = timePart.match(twentyFourHourRegex);
      if (match24) {
        return `${String(parseInt(match24[1], 10)).padStart(2, "0")}:${match24[2]}`;
      }
    } else {
      // Convert to 12-hour format (e.g. "7:00 PM")
      const match24 = timePart.match(twentyFourHourRegex);
      if (match24) {
        let hours = parseInt(match24[1], 10);
        const minutes = match24[2];
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${hours}:${minutes} ${ampm}`;
      }
      const match12 = timePart.match(twelveHourRegex);
      if (match12) {
        const hours = parseInt(match12[1], 10);
        const minutes = match12[2] || "00";
        const ampm = match12[3].toUpperCase();
        return `${hours}:${minutes} ${ampm}`;
      }
    }
    return timePart;
  };

  const formatTimeRange = (rangeStr: string, to24: boolean): string => {
    if (!rangeStr) return "";
    if (rangeStr.toLowerCase().includes("closed")) return t("closed") || rangeStr;

    // Split by dash or hyphen
    const parts = rangeStr.split(/\s*-\s*/);
    if (parts.length === 2) {
      const start = parseAndFormatTime(parts[0], to24);
      const end = parseAndFormatTime(parts[1], to24);
      return `${start} - ${end}`;
    }
    return parseAndFormatTime(rangeStr, to24);
  };

  useEffect(() => {
    const fetchAboutData = async () => {
      try {
        const data = await fetchAboutPageWithCache();
        if (data) {
          setAboutData(data);
        }
      } catch (error) {
        console.error("Error fetching contact page data:", error);
      }
    };
    fetchAboutData();
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:${aboutData?.helpline || theme.constants.mobile}`);
  };

  const handleWhatsApp = () => {
    const message = t("contactUsMessage") || "Hello, I would like to know more about your services.";
    const mobileNum = aboutData?.helpline || theme.constants.whatsapp || theme.constants.mobile;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}&phone=${mobileNum}`;
    Linking.openURL(url).catch(() => {
      // Fallback for when WhatsApp is not installed
      Linking.openURL(`https://wa.me/${mobileNum}?text=${encodeURIComponent(message)}`);
    });
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${aboutData?.support_email || theme.constants.email}`);
  };

  const openGoogleMaps = () => {
    if (aboutData?.map_url && aboutData.map_url.startsWith("http")) {
      Linking.openURL(aboutData.map_url).catch((err) => console.error("Error opening map url:", err));
      return;
    }
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
    Linking.openURL(aboutData?.website_url || theme.constants.website);
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
              source={aboutData?.image_url ? { uri: getFullImageUrl(aboutData.image_url) } : require("../../../../../../assets/images/shop.jpg")}
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
                <Ionicons name="call" size={24} color={theme.colors.textDark} />
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
                  {(aboutData?.website_url || theme.constants.website).replace(/^https?:\/\//, "")}
                </Text>
                <Feather name="external-link" size={20} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Business Hours */}
          <View style={styles.hoursContainer}>
            <View style={styles.hoursHeaderRow}>
              <Text style={styles.hoursTitle}>{t("businessHours")}</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setIs24Hour(!is24Hour)}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {is24Hour ? "12H" : "24H"}
                </Text>
              </TouchableOpacity>
            </View>
            {!aboutData?.business_hours ? (
              <>
                <View style={styles.hourRow}>
                  <Text style={styles.dayText}>{t("monSat")}</Text>
                  <Text style={styles.timeText}>
                    {formatTimeRange("9:30 AM - 7:00 PM", is24Hour)}
                  </Text>
                </View>
                <View style={[styles.hourRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.dayText, { color: theme.colors.textDark }]}>
                    {t("sunday")}
                  </Text>
                  <Text style={[styles.timeText, { color: theme.colors.textDark }]}>
                    {t("closed")}
                  </Text>
                </View>
              </>
            ) : typeof aboutData.business_hours === "string" ? (
              <View style={[styles.hourRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.dayText}>{t("businessHours")}</Text>
                <Text style={styles.timeText}>
                  {formatTimeRange(aboutData.business_hours, is24Hour)}
                </Text>
              </View>
            ) : (
              Object.keys(aboutData.business_hours).map((key, index, arr) => {
                const item = aboutData.business_hours[key];
                const timeString = typeof item === "object" && item !== null
                  ? `${item.open || ""} - ${item.close || ""}`
                  : String(item);
                const formattedDay = key
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ");
                return (
                  <View
                    key={key}
                    style={[
                      styles.hourRow,
                      index === arr.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={styles.dayText}>{formattedDay}</Text>
                    <Text style={styles.timeText}>
                      {formatTimeRange(timeString, is24Hour)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Company Info */}
          <View style={styles.companyContainer}>
            <Text style={styles.companyTitle}>DC JEWELLERS</Text>
            <Text style={styles.companySubtitle}>Since 2020</Text>
            <Text style={styles.companyAddress}>
              {aboutData?.shop_addr || aboutData?.shop_address || theme.constants.address}
            </Text>
          </View>
        </ScrollView>
      </View>
    </AppLayoutWrapper>
  );
};

function getStyles(theme: any) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.quaternary,
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
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
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
  },
  hoursHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: "rgba(133, 1, 17, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(133, 1, 17, 0.2)",
  },
  toggleButtonText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: "700",
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  timeText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.textDark,
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
    color: theme.colors.textDark,
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  companyAddress: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "80%",
  },
}) }

var styles = getStyles(theme);;

export default ContactUs;

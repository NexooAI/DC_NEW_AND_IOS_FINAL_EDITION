import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { moderateScale } from "react-native-size-matters";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore from "@/store/global.store";

const { width, height } = Dimensions.get("window");

export default function ContactUs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();


  const openGoogleMaps = async () => {
    const url =
      "https://www.google.com/maps/place/DC+Jewellers,+Gold+and+Diamonds/@10.5215326,76.2217161,9800m/data=!3m1!1e3!4m6!3m5!1s0x3ba7ef7ed58a6545:0x7ee60c0c1146bf78!8m2!3d10.5192833!4d76.2234851!16s%2Fg%2F11l121j4br?hl=en-IN&entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D";

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(t("cantOpenMapLink"));
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${theme.constants.mobile}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${theme.constants.email}`);
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/${theme.constants.mobile.replace(
      /\s/g,
      ""
    )}`;
    Linking.openURL(whatsappUrl);
  };

  const handleWebsite = () => {
    Linking.openURL(theme.constants.website);
  };

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Section */}
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary]}
              style={styles.heroSection}
            >
              <View style={styles.heroContent}>
                {/* <View style={styles.iconContainer}>
              <Feather name="message-circle" size={40} color="white" />
            </View> */}
                <Text style={styles.heroTitle}>{t("getInTouch")}</Text>
                <Text style={styles.heroSubtitle}>
                  {t("contactUsSubtitle")}
                </Text>
              </View>
            </LinearGradient>

            {/* Contact Cards */}
            {/* <View style={styles.cardsContainer}> */}
            {/* Email Card */}
            {/* <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <MaterialIcons name="email" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>Email Us</Text>
              <Text style={styles.cardValue}>{theme.constants.email}</Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity> */}

            {/* Phone Card */}
            {/* <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="call" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>Call Us</Text>
              <Text style={styles.cardValue}>{theme.constants.mobile}</Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity> */}

            {/* WhatsApp Card */}
            {/* <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
            <LinearGradient
              colors={['#25D366', '#20BA5A']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <FontAwesome5 name="whatsapp" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>WhatsApp</Text>
              <Text style={styles.cardValue}>Chat with us instantly</Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity> */}

            {/* Address Card */}
            {/* <TouchableOpacity style={styles.contactCard} onPress={openGoogleMaps}>
            <LinearGradient
              colors={['#A8E6CF', '#7FCDCD']}
              style={styles.cardGradient}
            >
              <View style={styles.cardIcon}>
                <Ionicons name="location" size={28} color="white" />
              </View>
              <Text style={styles.cardTitle}>Visit Us</Text>
              <Text style={styles.cardValue} numberOfLines={2}>
                {theme.constants.address}
              </Text>
              <View style={styles.cardArrow}>
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity> */}
            {/* </View> */}

            {/* Quick Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>{t("quickActions")}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCall}
                >
                  <View style={styles.actionIcon}>
                    <Ionicons
                      name="call"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.actionText}>{t("callNow")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleWhatsApp}
                >
                  <View style={styles.actionIcon}>
                    <FontAwesome5
                      name="whatsapp"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.actionText}>{t("whatsApp")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={openGoogleMaps}
                >
                  <View style={styles.actionIcon}>
                    <FontAwesome5
                      name="map-marker-alt"
                      size={24}
                      color={theme.colors.primary}
                    />
                  </View>
                  <Text style={styles.actionText}>{t("maps")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Website Section */}
            <View style={styles.websiteContainer}>
              <Text style={styles.websiteTitle}>{t("visitOurWebsite")}</Text>
              <TouchableOpacity
                style={styles.websiteButton}
                onPress={handleWebsite}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primary]}
                  style={styles.websiteGradient}
                >
                  <Feather name="globe" size={24} color="white" />
                  <Text style={styles.websiteText}>
                    {theme.constants.website}
                  </Text>
                  <Feather name="external-link" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Business Hours */}
            <View style={styles.hoursContainer}>
              <Text style={styles.hoursTitle}>{t("businessHours")}</Text>
              <View style={styles.hoursContent}>
                <View style={styles.hourRow}>
                  <Text style={styles.dayText}>{t("mondayFriday")}</Text>
                  <Text style={styles.timeText}>9:00 AM - 9:00 PM</Text>
                </View>
                <View style={styles.hourRow}>
                  <Text style={styles.dayText}>{t("saturday")}</Text>
                  <Text style={styles.timeText}>9:00 AM - 9:00 PM</Text>
                </View>
                <View style={styles.hourRow}>
                  <Text style={styles.dayText}>{t("sunday")}</Text>
                  <Text style={styles.timeText}>10:00 AM - 2:00 PM</Text>
                </View>
              </View>
            </View>

            {/* Company Info */}
            <View style={styles.companyContainer}>
              <Text style={styles.companyTitle}>
                {theme.constants.customerName}
              </Text>
              <Text style={styles.companySubtitle}>{t("goldAndDiamonds")}</Text>
              <Text style={styles.companyAddress}>
                {theme.constants.address}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    height: height * 0.25,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginTop: -30,
    gap: 16,
  },
  contactCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    position: "relative",
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    flex: 1,
  },
  cardArrow: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  websiteContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  websiteTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  websiteButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  websiteGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  websiteText: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  hoursContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hoursTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  hoursContent: {
    gap: 12,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dayText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  companyContainer: {
    marginTop: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  companySubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 12,
    textAlign: "center",
  },
  companyAddress: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },
});

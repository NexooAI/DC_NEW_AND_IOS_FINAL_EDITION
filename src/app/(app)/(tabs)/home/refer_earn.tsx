import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Alert,
  ImageBackground,
  ScrollView,
  Dimensions,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import useGlobalStore from "@/store/global.store";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import { logger } from "@/utils/logger";
const { width, height } = Dimensions.get("window");

export default function ReferCodeScreen() {
  const { t } = useTranslation();
  // Retrieve referral code from your global store; fallback to a default value
  const { user } = useGlobalStore();
  const code = user?.referralCode || t("defaultReferralCode") || "DEFAULT123";

  const router = useRouter();


  // Copy code to clipboard and notify user
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert(t("copied"), t("referral_code_copied"));
  };

  // Share referral code using native share dialog
  const onShare = async () => {
    try {
      const result = await Share.share({
        title: t("refer_earn_title"),
        message: (
          t("refer_earn_share_message") ||
          "Use my referral code {code} to sign up and earn rewards! Download the app here: https://play.google.com/store/apps/details?id=com.nexooai.dcjewellery&hl=en_IN"
        ).replace("{code}", code),
      });
      if (result.action === Share.sharedAction) {
        //logger.log("Shared successfully");
      } else if (result.action === Share.dismissedAction) {
        //logger.log("Share dismissed");
      }
    } catch (error: any) {
      Alert.alert(t("error"), error.message);
    }
  };

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
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
            <View style={styles.heroIconContainer}>
              <MaterialIcons name="card-giftcard" size={40} color="white" />
            </View>
            <Text style={styles.heroTitle}>{t("refer_earn_title")}</Text>
            <Text style={styles.heroSubtitle}>{t("refer_earn_subtitle")}</Text>
          </View>
        </LinearGradient>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Referral Code Card */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <Ionicons
                name="qr-code-outline"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.codeHeaderText}>{t("yourReferralCode")}</Text>
            </View>

            <View style={styles.codeContainer}>
              <Text style={styles.codeText}>{code}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={copyToClipboard}
              >
                <Ionicons name="copy-outline" size={20} color="#fff" />
                <Text style={styles.copyButtonText}>{t("copy")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>{t("howItWorks")}</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons
                    name="share-social"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.benefitText}>{t("shareReferralCode")}</Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons
                    name="person-add"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.benefitText}>{t("theySignUp")}</Text>
              </View>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <Ionicons
                    name="gift"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.benefitText}>{t("bothGetRewards")}</Text>
              </View>
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={onShare}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primary]}
              style={styles.shareGradient}
            >
              <Ionicons name="share-social" size={24} color="gold" />
              <Text style={styles.shareButtonText}>{t("share_code")}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppLayoutWrapper>
  );
}

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
  heroSection: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -40,
  },
  codeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    alignItems: "center",
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  codeHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.textMediumGrey,
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF9E5", // Light gold tint
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.secondary, // Gold border
    borderStyle: "dashed",
    width: "100%",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.primary,
    letterSpacing: 2,
    flex: 1,
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  copyButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  benefitsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 24,
    textAlign: "center",
  },
  benefitsList: {
    gap: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  benefitText: {
    fontSize: 15,
    color: theme.colors.textDarkGrey,
    flex: 1,
    lineHeight: 22,
    fontWeight: "500",
  },
  shareButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ scale: 1 }],
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "700",
    marginLeft: 10,
    letterSpacing: 0.5,
  },
});

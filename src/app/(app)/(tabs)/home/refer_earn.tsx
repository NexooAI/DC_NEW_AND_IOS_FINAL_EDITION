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
    paddingBottom: 20, // Reduced padding since AppLayoutWrapper handles bottom bar
  },
  heroSection: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  contentContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  codeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  codeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  codeHeaderText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    marginLeft: 8,
  },
  codeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e0406",
    flex: 1,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  copyButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "bold",
  },
  benefitsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  benefitsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(139, 0, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  shareButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  shareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  shareButtonText: {
    fontSize: 18,
    color: "gold",
    fontWeight: "bold",
    marginLeft: 8,
  },
});

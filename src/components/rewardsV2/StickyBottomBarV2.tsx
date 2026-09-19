import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Share, Linking, Alert } from "react-native";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StickyBottomBarV2Props {
  referralCode: string;
  shareMessage?: string;
  baseUrl?: string;
}

export const StickyBottomBarV2: React.FC<StickyBottomBarV2Props> = ({
  referralCode,
  shareMessage,
  baseUrl = "https://api.prod.srimurugangoldhouse.in",
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const finalShareMessage =
    shareMessage ||
    (t("refer_earn_share_message") ||
      `Use my referral code {code} to sign up at Sri Murugan Gold House and earn exciting rewards! Download app: ${baseUrl}/refer?code={code}`).replace(
      /{code}/g,
      referralCode
    );

  const handleWhatsAppShare = () => {
    const url = `whatsapp://send?text=${encodeURIComponent(finalShareMessage)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        t("error") || "Error",
        t("whatsapp_not_installed") || "Please make sure WhatsApp is installed on your device."
      );
    });
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({
        title: t("referAndEarn") || "Refer & Earn",
        message: finalShareMessage,
      });
    } catch (error: any) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.actionRow}>
        {/* WhatsApp Invite Button */}
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsAppShare}
          activeOpacity={0.85}
        >
          <FontAwesome5 name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.whatsappButtonText}>
            {t("refer_earn_whatsapp_invite") || "Invite on WhatsApp"}
          </Text>
        </TouchableOpacity>

        {/* Generic Share Button */}
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleNativeShare}
          activeOpacity={0.8}
        >
          <Ionicons name="share-social-outline" size={22} color="#128C7E" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  whatsappButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: "#25D366",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
  },
});

export default StickyBottomBarV2;

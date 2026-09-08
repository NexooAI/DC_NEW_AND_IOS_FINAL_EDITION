import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { moderateScale } from "react-native-size-matters";
import useGlobalStore, { useAppTheme } from "@/store/global.store";

interface ConnectWithUsV2Props {
  socialMediaUrls?: any;
}

export const ConnectWithUsV2: React.FC<ConnectWithUsV2Props> = ({
  socialMediaUrls,
}) => {
  const theme = useAppTheme();

  const handleOpenUrl = async (url: string, platform: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert("Unable to Open", `Could not open ${platform}`);
    }
  };

  const handleInstagram = () => {
    const url =
      socialMediaUrls?.[0]?.intsa_url ||
      socialMediaUrls?.[0]?.insta_url ||
      (theme.constants as any)?.instagram ||
      "https://www.instagram.com/";
    handleOpenUrl(url, "Instagram");
  };

  const handleFacebook = () => {
    const url =
      socialMediaUrls?.[0]?.facebook_url ||
      (theme.constants as any)?.facebook ||
      "https://www.facebook.com/";
    handleOpenUrl(url, "Facebook");
  };

  const handleYouTube = () => {
    const url =
      socialMediaUrls?.[0]?.youtube_url ||
      (theme.constants as any)?.youtube ||
      "https://www.youtube.com/";
    handleOpenUrl(url, "YouTube");
  };

  const handleWhatsApp = () => {
    const rawNumber =
      socialMediaUrls?.[0]?.whatsapp_number ||
      (theme.constants as any)?.whatsapp ||
      (theme.constants as any)?.mobile ||
      "919876543210";
    const cleanNumber = String(rawNumber).replace(/[^\d]/g, "");
    const text = encodeURIComponent("Hello Suresh Fashion Jewellery, I would like to enquire about your chit schemes.");
    const url = `whatsapp://send?phone=${cleanNumber}&text=${text}`;
    const webUrl = `https://wa.me/${cleanNumber}?text=${text}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(webUrl);
        }
      })
      .catch(() => Linking.openURL(webUrl));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect With Us</Text>

      <View style={styles.row}>
        {/* Instagram */}
        <TouchableOpacity
          style={styles.channelItem}
          onPress={handleInstagram}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#833AB4", "#FD1D1D", "#FCB045"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBox}
          >
            <Ionicons name="logo-instagram" size={24} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.channelLabel}>Instagram</Text>
        </TouchableOpacity>

        {/* Facebook */}
        <TouchableOpacity
          style={styles.channelItem}
          onPress={handleFacebook}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: "#1877F2" }]}>
            <Ionicons name="logo-facebook" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.channelLabel}>Facebook</Text>
        </TouchableOpacity>

        {/* YouTube */}
        <TouchableOpacity
          style={styles.channelItem}
          onPress={handleYouTube}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: "#FF0000" }]}>
            <Ionicons name="logo-youtube" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.channelLabel}>YouTube</Text>
        </TouchableOpacity>

        {/* WhatsApp */}
        <TouchableOpacity
          style={styles.channelItem}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
        >
          <View style={[styles.iconBox, { backgroundColor: "#25D366" }]}>
            <Ionicons name="logo-whatsapp" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.channelLabel}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
  },
  title: {
    fontSize: moderateScale(16),
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.2,
    marginBottom: moderateScale(12),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  channelItem: {
    alignItems: "center",
    width: moderateScale(70),
  },
  iconBox: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(16),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },
  channelLabel: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#475569",
    marginTop: moderateScale(6),
    textAlign: "center",
  },
});

export default ConnectWithUsV2;

// Dashboard.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Linking,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api, { userAPI } from "@/services/api";
import { theme } from "@/constants/theme";

const { wp, hp, rf } = responsiveUtils;
const { width } = Dimensions.get("window");

const PRIMARY = "#7A0019";
const DARK = "#4A0010";
const GOLD = "#D4AF37";
const CARD = "#3B1F14";

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setChatOpen } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const headerPaddingTop = Platform.OS === "ios" ? 10 : 10;

  const [rates, setRates] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user) return;

      const res = await api.get(
        `/home?userId=${user.id || (user as any).id}`,
        { skipLoading: true } as any
      );

      if (res.data.success) {
        setRates(res.data.data.currentRates);
      }

      const social = await api.get(
        "/videos/active",
        { skipLoading: true } as any
      );

      if (social.data.success && social.data.data.length > 0) {
        setSocialLinks(social.data.data[0]);
      }

      // Fetch user profile to get latest profile image
      try {
        const profileRes = await userAPI.getProfile();
        if (profileRes.data.success && profileRes.data.data) {
          const userData = profileRes.data.data;
          const photo =
            userData.profile_photo ||
            userData.profileImage ||
            userData.profile_image ||
            userData.image ||
            userData.avatar ||
            null;

          if (photo) {
            // Construct full URL if it's a relative path
            const fullUrl = photo.startsWith("http")
              ? photo
              : `${theme.baseUrl}${photo.startsWith("/") ? "" : "/"}${photo}`;
            setProfileImage(fullUrl);
          }
        }
      } catch (profileError) {
        console.log("Profile fetch error:", profileError);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getProfileImage = () => {
    // Prefer API-fetched profile image, then fallback to store fields
    if (profileImage) return profileImage;

    const photo =
      (user as any)?.profile_photo ||
      user?.profileImage ||
      (user as any)?.profile_image ||
      (user as any)?.image ||
      (user as any)?.avatar ||
      null;

    if (photo && !photo.startsWith("http")) {
      return `${theme.baseUrl}${photo.startsWith("/") ? "" : "/"}${photo}`;
    }
    return photo;
  };

  const openLink = (url: string) => Linking.openURL(url);

  const callNow = () =>
    Linking.openURL(`tel:${theme.constants.mobile}`);

  const openWhatsapp = async () => {
    const phone = `${theme.constants.whatsapp}`.replace(/\+/g, "");

    const appUrl = `whatsapp://send?phone=${phone}`;
    const webUrl = `https://wa.me/${phone}`;

    const supported = await Linking.canOpenURL(appUrl);

    if (supported) {
      await Linking.openURL(appUrl);
    } else {
      await Linking.openURL(webUrl);
    }
  };

  const cards = [
    {
      title: t("ourSchemes") || "Our Schemes",
      icon: "diamond-outline",
      onPress: () => router.push("/(app)/(tabs)/savings"),
    },
    {
      title: t("advanceBooking") || "Advance Booking",
      icon: "calendar-outline",
      onPress: () => router.push("/(app)/gold_advance"),
    },
    {
      title: t("billPayments") || "Bill Payments",
      icon: "calculator-outline",
      onPress: () => router.push("/(app)/bill_payment"),
    },
    {
      title: t("rewards") || "Rewards",
      icon: "gift-outline",
      onPress: () => router.push("/(app)/(tabs)/rewards"),
    },
    {
      title: t("newCollections") || "Collections",
      icon: "sparkles-outline",
      onPress: () =>
        router.push({
          pathname: "/(app)/(tabs)/home",
          params: {
            autoTrigger: "collection",
            redirectOnClose: "dashboard",
          },
        }),
    },
    // {
    //   title: t("luckyDraw") || "Lucky Draw",
    //   icon: "ticket-outline",
    //   onPress: () => router.push("/(app)/lucky_draw"),
    // },
    {
      title: t("newSchemes") || "New Schemes",
      icon: "briefcase-outline",
      onPress: () => router.push("/(app)/(tabs)/home/schemes"),
    },
    {
      title: t("savingsHome") || "Chit Home",
      icon: "home-outline",
      onPress: () => router.push("/(app)/(tabs)/home"),
    },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.quaternary },
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={DARK}
      />

      <View style={{ flex: 1, backgroundColor: theme.colors.quaternary }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={[DARK, PRIMARY]}
            style={[styles.header, { paddingTop: headerPaddingTop }]}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={styles.profileRow}
                onPress={() => router.push("/(app)/(tabs)/profile")}
                activeOpacity={0.7}
              >
                {getProfileImage() ? (
                  <Image
                    source={{
                      uri: getProfileImage(),
                    }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={styles.profilePlaceholder}
                  >
                    <Ionicons
                      name="person"
                      size={20}
                      color="#fff"
                    />
                  </View>
                )}

                <View style={{ marginLeft: 10 }}>
                  <ResponsiveText
                    color="#ddd"
                    size="xs"
                  >
                    Hi,
                  </ResponsiveText>

                  <ResponsiveText
                    color="#fff"
                    size="md"
                    weight="bold"
                  >
                    {user?.name ||
                      user?.username ||
                      "Guest"}
                  </ResponsiveText>
                </View>
              </TouchableOpacity>

              <View style={styles.rightIcons}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={callNow}
                >
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={openWhatsapp}
                >
                  <Ionicons
                    name="logo-whatsapp"
                    size={20}
                    color="#25D366"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.rateRow}>
              <ResponsiveText
                color={GOLD}
                size="sm"
              >
                Gold
              </ResponsiveText>

              <ResponsiveText
                color="#fff"
                size="sm"
                weight="bold"
                style={{ marginLeft: 5 }}
              >
                ₹ {rates?.gold_rate || "14900"}
              </ResponsiveText>

              <View style={styles.divider} />

              <ResponsiveText
                color={GOLD}
                size="sm"
              >
                Silver
              </ResponsiveText>

              <ResponsiveText
                color="#fff"
                size="sm"
                weight="bold"
                style={{ marginLeft: 5 }}
              >
                ₹ {rates?.silver_rate || "290"}
              </ResponsiveText>
            </View>

            <ResponsiveText
              color="#ddd"
              size="sm"
              style={{ marginTop: 8 }}
            >
              Luxury Meets Excellence
            </ResponsiveText>
          </LinearGradient>

          {/* Cards */}
          <View style={styles.grid}>
            {cards.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.card,
                  index === cards.length - 1 && { width: "100%" }
                ]}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={item.icon as any}
                  size={rf(28)}
                  color={GOLD}
                />

                <ResponsiveText
                  style={styles.cardText}
                  color="#fff"
                  size="sm"
                  weight="bold"
                >
                  {item.title}
                </ResponsiveText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Row */}
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => setChatOpen(true)}
            >
              <LinearGradient
                colors={["#F4D06F", GOLD]}
                style={styles.chatGradient}
              >
                <MaterialCommunityIcons
                  name="chat-processing-outline"
                  size={18}
                  color={DARK}
                />

                <ResponsiveText
                  color={DARK}
                  weight="bold"
                  style={{ marginLeft: 6 }}
                >
                  Chat
                </ResponsiveText>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.social}
              onPress={() =>
                openLink(
                  socialLinks?.intsa_url ||
                  "https://instagram.com"
                )
              }
            >
              <Ionicons
                name="logo-instagram"
                size={20}
                color={GOLD}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.social}
              onPress={() =>
                openLink(
                  socialLinks?.facebook_url ||
                  "https://facebook.com"
                )
              }
            >
              <Ionicons
                name="logo-facebook"
                size={20}
                color={GOLD}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.social}
              onPress={() =>
                openLink(
                  socialLinks?.twitter_url ||
                  "https://youtube.com"
                )
              }
            >
              <Ionicons
                name="logo-youtube"
                size={20}
                color={GOLD}
              />
            </TouchableOpacity>
          </View>

          <View style={{ height: hp(4) }} />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: wp(5),
    paddingTop: 10,
    paddingBottom: hp(4),
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    alignItems: "center",
  },

  headerTop: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "62%",
  },

  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: GOLD,
  },

  profilePlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: GOLD,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    marginLeft: 10,
  },

  logo: {
    width: wp(55),
    height: hp(10),
    marginTop: hp(1),
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(1),
  },

  divider: {
    width: 1,
    height: 12,
    backgroundColor: "#fff",
    marginHorizontal: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    marginTop: hp(3),
  },

  card: {
    width: width / 2 - wp(7),
    backgroundColor: CARD,
    borderRadius: 18,
    paddingVertical: hp(2.5),
    alignItems: "center",
    marginBottom: hp(1.8),
    borderWidth: 1,
    borderColor: GOLD,
    ...shadowUtils.SHADOW_PRESETS.small,
  },

  cardText: {
    marginTop: 10,
    textAlign: "center",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(2.5),
    paddingHorizontal: wp(4),
  },

  chatBtn: {
    width: wp(36),
    borderRadius: 30,
    overflow: "hidden",
    marginRight: 10,
  },

  chatGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },

  social: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor:
      "rgba(212,175,55,0.4)",
  },
});
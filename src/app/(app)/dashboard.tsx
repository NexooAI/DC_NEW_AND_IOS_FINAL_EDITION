// Dashboard.tsx

import React, { useEffect, useState, useCallback } from "react";
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
  RefreshControl,
  BackHandler,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";

import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import api, { userAPI } from "@/services/api";
import { theme } from "@/constants/theme";
import LanguageSelector from "@/components/LanguageSelector";
import { fetchGoldRatesWithCache } from "@/utils/apiCache";

const { wp, hp, rf } = responsiveUtils;
const { width, height } = Dimensions.get("window");

const PRIMARY = "#7A0019";
const DARK = "#2e0406";
const GOLD = "#D4AF37";
const CARD = "#3B1F14";

let hasShownPopup = false;

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setChatOpen } = useGlobalStore();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const headerPaddingTop = Platform.OS === "ios" ? 10 : (insets.top > 0 ? insets.top + 10 : 10);

  const [rates, setRates] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupData, setPopupData] = useState<any>(null);

  useEffect(() => {
    loadData();
    fetchActivePopup();
  }, []);

  const fetchActivePopup = async () => {
    if (hasShownPopup) return;
    try {
      const res = await api.get("/initial-popups/active", { skipLoading: true } as any);
      if (res && res.data && res.data.success && res.data.data && res.data.data.length > 0) {
        setPopupData(res.data.data[0]);
        setPopupVisible(true);
        hasShownPopup = true;
      }
    } catch (err) {
      console.log("Error fetching active popup:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("#2e0406");
        StatusBar.setTranslucent(false);
      }

      const onBackPress = () => {
        Alert.alert(
          t("exitApp") || "Exit App",
          t("exitAppMsg") || "Are you sure you want to exit?",
          [
            { text: t("cancel") || "Cancel", onPress: () => null, style: "cancel" },
            { text: t("exit") || "Exit", onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: false }
        );
        return true; // Block default exit behavior
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [t])
  );

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      if (!user) return;

      const ratesData = await fetchGoldRatesWithCache(forceRefresh);
      if (ratesData) {
        setRates(ratesData);
      }

      const social = await api.get(
        "/videos/active",
        { skipLoading: true } as any
      );

      if (social.data.success && social.data.data.length > 0) {
        setSocialLinks(social.data.data[0]);
      }


    } catch (error) {
      console.log(error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
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

  const getPopupImageUrl = () => {
    if (!popupData) return null;
    const photo = popupData.image || popupData.image_url || popupData.url || null;
    if (photo && !photo.startsWith("http")) {
      return `${theme.baseUrl}${photo.startsWith("/") ? "" : "/"}${photo}`;
    }
    return photo;
  };

  const openLink = (url: string) => Linking.openURL(url);

  const getDerivedRate = (rateVal: string | undefined, carat: number) => {
    if (rateVal) {
      const sanitized = rateVal.replace(/,/g, "");
      const parsed = parseFloat(sanitized);
      if (!isNaN(parsed) && parsed > 0) {
        return Math.round(parsed).toString();
      }
    }
    const baseGold = rates?.gold_rate ? parseFloat(rates.gold_rate.replace(/,/g, "")) : 0;
    if (isNaN(baseGold) || baseGold <= 0) return "-";
    const derived = Math.round(baseGold * (carat / 22));
    return derived.toString();
  };

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
      title: t("newSchemes") || "New Schemes",
      icon: "briefcase-outline",
      iconType: "ionicons",
      onPress: () => router.push("/(app)/(tabs)/home/schemes"),
    },
    {
      title: t("ourSchemes") || "My Schemes",
      icon: "piggy-bank-outline",
      iconType: "material",
      onPress: () => router.push("/(app)/(tabs)/savings"),
    },
    {
      title: t("advanceBooking") || "Advance Booking",
      icon: "calendar-outline",
      iconType: "ionicons",
      onPress: () => router.push("/(app)/gold_advance"),
    },
    {
      title: t("billPayments") || "Bill Payments",
      icon: "calculator-outline",
      iconType: "ionicons",
      onPress: () => router.push("/(app)/bill_payment"),
    },
    {
      title: t("rewards") || "Rewards",
      icon: "gift-outline",
      iconType: "ionicons",
      onPress: () => router.push("/(app)/(tabs)/rewards"),
    },
    {
      title: t("newCollections") || "Collections",
      icon: "sparkles-outline",
      iconType: "ionicons",
      onPress: () =>
        router.push({
          pathname: "/(app)/(tabs)/home",
          params: {
            autoTrigger: "collection",
            redirectOnClose: "dashboard",
          },
        }),
    },
    {
      title: t("luckyDraw") || "Lucky Draw",
      icon: "trophy-outline",
      iconType: "ionicons",
      onPress: () => router.push("/(app)/lucky_draw"),
    },
    {
      title: t("oldGoldScheme") || "Old Gold Scheme",
      icon: "gold",
      iconType: "material",
      onPress: () => router.push("/(app)/old_gold"),
    },
    {
      title: t("savingsHome") || "Home",
      icon: "home-outline",
      iconType: "ionicons",
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
      {isFocused && (
        <StatusBar
          barStyle="light-content"
          backgroundColor={DARK}
          translucent={false}
        />
      )}

      <View style={{ flex: 1, backgroundColor: theme.colors.quaternary }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, backgroundColor: theme.colors.quaternary }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[GOLD]}
              tintColor={GOLD}
            />
          }
        >
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

                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setLanguageSelectorVisible(true)}
                >
                  <Ionicons
                    name="language"
                    size={20}
                    color="#fff"
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
              <View style={styles.rateChip}>
                <ResponsiveText color={GOLD} size="xs" weight="bold">22KT</ResponsiveText>
                <ResponsiveText color="#fff" size="sm" weight="bold" style={{ marginLeft: 4 }}>
                  ₹{getDerivedRate(rates?.gold_rate, 22)}
                </ResponsiveText>
              </View>

              <View style={styles.divider} />

              <View style={styles.rateChip}>
                <ResponsiveText color={GOLD} size="xs" weight="bold">18KT</ResponsiveText>
                <ResponsiveText color="#fff" size="sm" weight="bold" style={{ marginLeft: 4 }}>
                  ₹{getDerivedRate(rates?.gold_rate_18, 18)}
                </ResponsiveText>
              </View>

              <View style={styles.divider} />

              <View style={styles.rateChip}>
                <ResponsiveText color={GOLD} size="xs" weight="bold">14KT</ResponsiveText>
                <ResponsiveText color="#fff" size="sm" weight="bold" style={{ marginLeft: 4 }}>
                  ₹{getDerivedRate(rates?.gold_rate_14, 14)}
                </ResponsiveText>
              </View>
            </View>

            {/* <ResponsiveText
              color="#ddd"
              size="sm"
              style={{ marginTop: 8 }}
            >
              Luxury Meets Excellence
            </ResponsiveText> */}
          </LinearGradient>

          <View style={{ flex: 1, justifyContent: "space-between" }}>
            {/* Cards */}
            <View style={styles.grid}>
              {cards.map((item, index) => {
                const isLastCard = index === cards.length - 1;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.card,
                      isLastCard && { width: "100%" }
                    ]}
                    onPress={item.onPress}
                    activeOpacity={0.8}
                  >
                    {/* Premium Wave/Curve Design Accents */}
                  <View style={styles.cardDecor1} pointerEvents="none" />
                  <View style={styles.cardDecor2} pointerEvents="none" />

                  {item.iconType === "material" ? (
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={rf(24)}
                      color={GOLD}
                    />
                  ) : (
                    <Ionicons
                      name={item.icon as any}
                      size={rf(24)}
                      color={GOLD}
                    />
                  )}

                  <ResponsiveText
                    style={styles.cardText}
                    color="#fff"
                    size="sm"
                    weight="bold"
                  >
                    {item.title}
                  </ResponsiveText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Bottom Row */}
            <View style={[styles.bottomRow, { marginBottom: insets.bottom + 20 }]}>
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
                    socialLinks?.insta_url ||
                    "https://www.instagram.com/dcjewellers.official/?hl=en"
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
                    "https://www.facebook.com/dcjewellers.official/"
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
                    socialLinks?.youtube_url ||
                    socialLinks?.video_url ||
                    socialLinks?.url ||
                    "https://www.youtube.com/@DCJewellersGoldandDiamonds?themeRefresh=1"
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
          </View>

          <View style={{ height: hp(4) }} />
        </ScrollView>
      </View>

      <LanguageSelector
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
      />

      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPopupVisible(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <TouchableOpacity
              style={styles.popupCloseBtn}
              onPress={() => setPopupVisible(false)}
            >
              <Ionicons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
            {getPopupImageUrl() && (
              <Image
                source={{ uri: getPopupImageUrl() as string }}
                style={styles.popupImage}
                resizeMode="cover"
              />
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: hp(2.5),
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
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
    height: hp(7.5),
    marginTop: hp(0.5),
  },

  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(1),
  },
  rateChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
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
    marginTop: hp(2),
  },

  card: {
    width: "47%",
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: hp(1.8),
    alignItems: "center",
    marginBottom: hp(1.5),
    borderWidth: 1,
    borderColor: GOLD,
    overflow: "hidden",
    position: "relative",
    ...shadowUtils.SHADOW_PRESETS.small,
  },

  cardText: {
    marginTop: 8,
    textAlign: "center",
    zIndex: 2,
  },

  cardDecor1: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212, 175, 55, 0.06)", // Translucent gold accent
    zIndex: 1,
  },

  cardDecor2: {
    position: "absolute",
    right: -10,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)", // Translucent white wave curve
    backgroundColor: "transparent",
    zIndex: 1,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: hp(1.5),
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
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  popupContainer: {
    width: width * 0.85,
    height: height * 0.65,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  popupImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  popupCloseBtn: {
    position: "absolute",
    top: -45,
    right: 0,
    zIndex: 10,
  },
});
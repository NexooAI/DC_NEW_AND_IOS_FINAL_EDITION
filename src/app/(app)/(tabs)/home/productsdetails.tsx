import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
// AppHeader is now handled by the layout wrapper
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { useLocalSearchParams as useSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import api from "@/services/api";

import { logger } from "@/utils/logger";
const { width } = Dimensions.get("window");

interface SchemeData {
  scheme_id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  status: string;
}

// Dummy data to use if API does not return any valid scheme data.
const dummyData: SchemeData = {
  scheme_id: 0,
  title: "Digi Gold Savings",
  subtitle: "Secure your future with digital gold",
  description:
    "Join our Digi Gold Savings scheme to invest in gold digitally, earn high returns and save for the future. Our flexible plans are designed to suit your financial goals.",
  image: "", // Optionally add a local image fallback URL if needed.
  status: "active",
};

export default function KnowProduct() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useGlobalStore();
  const searchParams = useSearchParams();
  const schemeId = Array.isArray(searchParams.schemeId)
    ? searchParams.schemeId[0]
    : searchParams.schemeId;

  // State to store fetched scheme data
  const [schemeData, setSchemeData] = useState<SchemeData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<Error | null>(null);

  // Fetch the scheme data from the API when the component mounts
  useEffect(() => {
    api
      .get(`/schemesknowmore/scheme/${schemeId}`)
      .then((response) => {
        if (
          response.data &&
          response.data.data &&
          response.data.data.length > 0
        ) {
          setSchemeData(response.data.data[0]);
        } else {
          setSchemeData(dummyData);
        }
      })
      .catch((err) => {
        logger.error("Error fetching scheme data:", err);
        setSchemeData(dummyData);
        setFetchError(err);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [schemeId]);

  // Memoize translations; override title/description if API data is available
  const translations = useMemo(
    () => ({
      schemeTitle: schemeData?.title || t("schemeTitle"),
      schemeSubtitle: schemeData?.subtitle || t("schemeDescription"),
      schemeFullDescription: schemeData?.description || "",
      whyChoose: `Why Choose ${schemeData?.title || t("schemeTitle")}`,
      howToJoin: t("howToJoin"),
      schemeFeatures: t("schemeFeatures"),
      minInvestment: t("minInvestment"),
      duration: t("duration"),
      returns: t("returns"),
      advantages: [
        { icon: "shield-outline", text: t("secureInvestment") },
        { icon: "arrow-up-circle-outline", text: t("highReturns") },
        { icon: "wallet-outline", text: t("flexiblePayment") },
        { icon: "phone-portrait-outline", text: t("digitalAccess") },
      ],
      steps: [
        { title: t("register"), desc: t("createAccount") },
        { title: t("kyc"), desc: t("completeVerification") },
        { title: t("choosePlan"), desc: t("selectDuration") },
        { title: t("startSaving"), desc: t("beginJourney") },
      ],
    }),
    [language, schemeData]
  );

  if (loadingData) {
    return (
      <SafeAreaView
        className="flex-1 justify-center items-center bg-white"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <SafeAreaView
        className="flex-1 bg-white"
        style={{ paddingTop: insets.top }}
      >
        {/* Header is now handled by the layout wrapper */}

        {/* Scrollable Content */}
        <ScrollView className="flex-1" contentContainerStyle={{}}>
          <View className="relative">
            <ImageBackground
              source={{ uri: theme.image.gold_pattern }}
              className="h-64 justify-end p-6 mt-16"
            >
              {/* <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-6 left-4 p-2 bg-white rounded-full z-10"
              >
                <Ionicons name="arrow-back" size={24} color="#850111" />
              </TouchableOpacity> */}

              <View className="bg-white/80 p-4 rounded-xl">
                <Text
                  className="text-2xl font-bold"
                  style={{ color: theme.colors.primary }}
                >
                  {translations.schemeTitle}
                </Text>
                <Text className="text-gray-700 mt-1">
                  {translations.schemeSubtitle}
                </Text>
              </View>
            </ImageBackground>

            {/* Description Section */}
            <View className="px-6 my-4">
              <Text
                className="text-xl font-bold mb-2"
                style={{ color: theme.colors.primary }}
              >
                Description
              </Text>
              <Text className="text-gray-700 leading-relaxed">
                {translations.schemeFullDescription}
              </Text>
            </View>

            {/* Advantages Section */}
            <View className="p-6 pb-24">
              <Text className="text-xl font-bold mb-4">
                {translations.whyChoose}
              </Text>
              <View className="flex-row flex-wrap justify-between">
                {translations.advantages.map((item, index) => (
                  <View
                    key={index}
                    className="w-[48%] bg-gray-50 rounded-xl p-4 mb-4"
                  >
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={24}
                      color={theme.colors.primary}
                    />
                    <Text className="font-semibold mt-2">{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* Process Section */}
              <Text className="text-xl font-bold mt-4 mb-4">
                {translations.howToJoin}
              </Text>
              <View className="bg-gray-50 rounded-xl p-4">
                {translations.steps.map((step, index) => (
                  <View key={index} className="flex-row items-center mb-4">
                    <View className="w-8 h-8 bg-[#850111] rounded-full items-center justify-center">
                      <Text className="text-white font-bold">{index + 1}</Text>
                    </View>
                    <View className="ml-4">
                      <Text className="font-bold">{step.title}</Text>
                      <Text className="text-gray-600">{step.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Features Grid */}
              <View className="mt-6">
                <Text className="text-xl font-bold mb-4">
                  {translations.schemeFeatures}
                </Text>
                <View className="bg-gray-50 rounded-xl p-4">
                  <View className="flex-row justify-between mb-4">
                    <Text className="text-gray-600">
                      {translations.minInvestment}
                    </Text>
                    <Text className="font-semibold">₹1000/month</Text>
                  </View>
                  <View className="flex-row justify-between mb-4">
                    <Text className="text-gray-600">Duration</Text>
                    {/* Fixed duration */}
                    <Text className="font-semibold">12 months</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">
                      {translations.returns}
                    </Text>
                    <Text className="font-semibold">Up to 12% p.a.</Text>
                  </View>
                </View>
              </View>

              {/* Back Button */}
              <SafeAreaView className="bg-white border-t border-gray-200">
                <View className="p-6">
                  <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-[#850111] p-4 rounded-xl"
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      Back to Schemes
                    </Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

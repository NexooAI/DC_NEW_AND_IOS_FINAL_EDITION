import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { theme } from "@/constants/theme";
import { COLORS } from "src/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { language } = useGlobalStore();
  const missingPath = Array.isArray(params.missing)
    ? `/${params.missing.join("/")}`
    : params.missing
    ? `/${params.missing}`
    : "";

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/404.jpg")}
        style={styles.image}
        resizeMode="contain"
      />

      <Text style={styles.title}>{t("not_found_title")}</Text>
      <Text style={styles.message}>{t("not_found_message")}</Text>
      {missingPath && (
        <Text style={styles.missingPath}>
          {t("not_found_tried_access")}{" "}
          <Text style={styles.pathText}>{missingPath}</Text>
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(tabs)/home")}
      >
        <Text style={styles.buttonText}>{t("not_found_go_home")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: COLORS.textMediumGrey,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  missingPath: {
    fontSize: 14,
    color: COLORS.textMediumGrey,
    textAlign: "center",
    marginBottom: 30,
  },
  pathText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

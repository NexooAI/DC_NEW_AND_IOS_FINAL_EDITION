import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import ResponsiveText from "@/components/ResponsiveText";
import ResponsiveButton from "@/components/ResponsiveButton";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { wp, hp, rf } = responsiveUtils;

export default function LuckyDraw() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#F2E6D2" }]} />
      <LinearGradient
        colors={["rgba(133,1,17,0.05)", "transparent"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <ResponsiveText
          variant="title"
          size="md"
          weight="bold"
          color={theme.colors.primary}
        >
          Lucky Draw
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift-outline" size={rf(100)} color={theme.colors.secondary} />
        </View>
        
        <ResponsiveText
          variant="title"
          size="lg"
          weight="bold"
          color={theme.colors.primary}
          align="center"
          style={styles.title}
        >
          Something Exciting is Coming!
        </ResponsiveText>
        
        <ResponsiveText
          variant="body"
          size="md"
          color="rgba(0,0,0,0.6)"
          align="center"
          style={styles.subtitle}
        >
          We're working on something special for you. Stay tuned for our upcoming lucky draws and win exciting prizes.
        </ResponsiveText>

        <ResponsiveButton
          title="Back to Dashboard"
          variant="secondary"
          onPress={() => router.replace("/(app)/dashboard")}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(10),
  },
  iconContainer: {
    marginBottom: hp(4),
  },
  title: {
    marginBottom: hp(2),
  },
  subtitle: {
    marginBottom: hp(6),
    lineHeight: 24,
  },
  button: {
    width: "100%",
  },
});

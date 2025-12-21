import React, { useState, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  ImageBackground,
  Text,
} from "react-native";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "src/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";

import { logger } from "@/utils/logger";
export default function AuthGuard() {
  const router = useRouter();
  const { login, isLoggedIn, user } = useGlobalStore();
  const { isFirstLaunch } = useFirstLaunch();
  const [isChecking, setIsChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState<
    "checking" | "validating" | "navigating" | "error"
  >("checking");
  const { screenWidth, screenHeight } = useResponsiveLayout();
  const logoWidth = screenWidth * 0.4;

  useEffect(() => {
    logger.log(
      "🔍 AuthGuard useEffect triggered - isFirstLaunch:",
      isFirstLaunch
    );

    // Wait for first launch check to complete
    if (isFirstLaunch === null) {
      logger.log("🔍 Waiting for first launch check to complete...");
      return;
    }

    // If it's the first launch, show intro screen
    if (isFirstLaunch) {
      logger.log("🚀 First launch detected, redirecting to intro");
      router.replace("/intro");
      return;
    }

    // Otherwise, proceed with authentication check
    logger.log("🔍 Starting authentication check...");
    checkAuthenticationStatus();
  }, [isFirstLaunch]);

  // Enhanced token validation with better error handling
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      logger.log("🔍 Validating token...");

      // Check if token is a valid string
      if (!token || typeof token !== "string" || token.trim() === "") {
        logger.log("❌ Token is empty or invalid");
        return false;
      }

      // Simple JWT expiration check
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        logger.log("❌ Token format is invalid (not a valid JWT)");
        return false;
      }

      // Decode the payload
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const currentTime = Date.now() / 1000;

      logger.log("🔍 Token payload:", {
        exp: payload.exp,
        currentTime: currentTime,
        isExpired: payload.exp && payload.exp < currentTime,
      });

      // Check if token is expired (with 2 minute buffer for network delays)
      if (payload.exp && payload.exp < currentTime + 120) {
        logger.log("❌ Token is expired");
        return false;
      }

      logger.log("✅ Token is valid");
      return true;
    } catch (error) {
      logger.error("❌ Error validating token:", error);
      return false;
    }
  };

  // Clear all stored authentication data
  const clearAuthData = async () => {
    try {
      logger.log("🧹 Clearing all authentication data...");
      await Promise.all([
        SecureStore.deleteItemAsync("authToken"),
        SecureStore.deleteItemAsync("accessToken"),
        SecureStore.deleteItemAsync("token"),
        SecureStore.deleteItemAsync("refreshToken"),
        AsyncStorage.removeItem("userData"),
      ]);
      logger.log("✅ Authentication data cleared");
    } catch (error) {
      logger.error("❌ Error clearing authentication data:", error);
    }
  };

  const checkAuthenticationStatus = async () => {
    try {
      setAuthStatus("checking");
      logger.log("🔐 Starting authentication check...");

      // Check if user is already logged in from global state
      if (isLoggedIn && user) {
        logger.log("✅ User already logged in, redirecting to home");
        setAuthStatus("navigating");
        router.replace("/(app)/(tabs)/home");
        return;
      }

      setAuthStatus("validating");

      // Check for stored authentication token (try multiple token keys)
      let token = await SecureStore.getItemAsync("authToken");
      logger.log("🔍 Checking authToken:", token ? "EXISTS" : "NOT FOUND");

      if (!token) {
        token = await SecureStore.getItemAsync("token");
        logger.log("🔍 Checking token:", token ? "EXISTS" : "NOT FOUND");
      }
      if (!token) {
        token = await SecureStore.getItemAsync("accessToken");
        logger.log("🔍 Checking accessToken:", token ? "EXISTS" : "NOT FOUND");
      }

      if (!token) {
        logger.log("❌ No authentication token found, redirecting to login");
        setAuthStatus("navigating");
        router.replace("/(auth)/login");
        return;
      }

      logger.log(
        "🔑 Token found:",
        token.substring(0, 20) + "...",
        "Length:",
        token.length
      );

      // Validate token expiration
      const isTokenValid = await validateToken(token);

      if (!isTokenValid) {
        logger.log(
          "❌ Token is invalid/expired, clearing data and redirecting to login"
        );
        await clearAuthData();
        setAuthStatus("navigating");
        router.replace("/(auth)/login");
        return;
      }

      // Token exists and is valid, check if user data is available
      const userData = await AsyncStorage.getItem("userData");
      logger.log("🔍 Checking userData:", userData ? "EXISTS" : "NOT FOUND");

      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          logger.log(
            "✅ Valid token and user data found, redirecting to MPIN verification"
          );
          logger.log("🔍 User data preview:", {
            user_id: parsedUserData.user_id,
            name: parsedUserData.name,
            mobile: parsedUserData.mobile_number,
            mpinStatus: parsedUserData.mpinStatus,
          });

          // Update global store with user data if not already set
          if (!isLoggedIn) {
            login(token, {
              id: parsedUserData.user_id || parsedUserData.id,
              name: parsedUserData.name || "",
              email: parsedUserData.email || "",
              mobile:
                parsedUserData.mobile_number || parsedUserData.mobile || "",
              profileImage:
                parsedUserData.profile_photo ||
                parsedUserData.profileImage ||
                "",
              referralCode: parsedUserData.referralCode || "",
              mpinStatus: parsedUserData.mpinStatus,
              usertype:
                parsedUserData.userType || parsedUserData.usertype || "",
            });
          }

          setAuthStatus("navigating");
          logger.log("🔍 Navigating to MPIN verification page...");
          router.replace("/(auth)/mpin_verify");
        } catch (parseError) {
          logger.error("❌ Error parsing user data:", parseError);
          await clearAuthData();
          setAuthStatus("navigating");
          router.replace("/(auth)/login");
        }
      } else {
        // Token exists but no user data → Go to login
        logger.log(
          "❌ Token exists but no user data, clearing data and redirecting to login"
        );
        await clearAuthData();
        setAuthStatus("navigating");
        router.replace("/(auth)/login");
      }
    } catch (error) {
      logger.error("❌ Authentication check error:", error);
      setAuthStatus("error");

      // On error, clear all stored data and go to login screen
      await clearAuthData();

      // Wait a moment before redirecting to show error state
      setTimeout(() => {
        setAuthStatus("navigating");
        router.replace("/(auth)/login");
      }, 1000);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking || isFirstLaunch === null) {
    const getStatusText = () => {
      switch (authStatus) {
        case "checking":
          return "Checking authentication...";
        case "validating":
          return "Validating token...";
        case "navigating":
          return "Redirecting...";
        case "error":
          return "Authentication error, redirecting...";
        default:
          return "Loading...";
      }
    };

    return (
      <ImageBackground
        source={
          typeof theme.image.bg_image === "string"
            ? { uri: theme.image.bg_image }
            : theme.image.bg_image
        }
        style={styles.backgroundImage}
      >
        <LinearGradient
          colors={[
            theme.colors.bgBlackHeavy,
            theme.colors.bgBlackMedium,
            theme.colors.bgBlackHeavy,
          ]}
          style={styles.gradient}
        >
          <View style={styles.container}>
            <Image
              source={
                typeof theme.images.auth.logo === "string"
                  ? { uri: theme.images.auth.logo }
                  : theme.images.auth.logo
              }
              style={[styles.logo, { width: logoWidth, aspectRatio: 1 }]}
              resizeMode="contain"
            />
            <ActivityIndicator
              size="large"
              color={authStatus === "error" ? COLORS.error : COLORS.secondary}
              style={styles.loader}
            />
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  // This should not render as we're redirecting
  return null;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: "cover",
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    textAlign: "center",
    opacity: 0.9,
  },
});

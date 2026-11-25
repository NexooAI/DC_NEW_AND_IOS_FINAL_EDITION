import React, { useState, useEffect, useRef } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  Animated,
  StatusBar,
} from "react-native";
import { Image } from "react-native";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "@/constants/colors";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { useFirstLaunch } from "@/common/hooks/useFirstLaunch";
import apiClient from "@/services/api";
import { resolveImageSource } from "@/utils/imageUtils";

import { logger } from "@/utils/logger";

const bgLoginImage = require("../../assets/images/bg_login.jpg");
const logoTransImage = require("../../assets/images/logo_trans.png");

const getSecureItemWithTimeout = async (key: string, timeoutMs = 1500): Promise<string | null> => {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      logger.warn(`⚠️ SecureStore.getItemAsync('${key}') timed out after ${timeoutMs}ms.`);
      resolve(null);
    }, timeoutMs);

    SecureStore.getItemAsync(key)
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        logger.error(`Error reading ${key} from SecureStore:`, err);
        resolve(null);
      });
  });
};

export default function AuthGuard() {
  const router = useRouter();
  const { login, isLoggedIn, user } = useGlobalStore();
  const { isFirstLaunch } = useFirstLaunch();
  const [isChecking, setIsChecking] = useState(true);
  const [authStatus, setAuthStatus] = useState<
    "checking" | "validating" | "navigating" | "error"
  >("checking");
  const { screenWidth, screenHeight } = useResponsiveLayout();
  const logoWidth = Math.min(screenWidth * 0.44, 175);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

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
      const decodeBase64 = (str: string): string => {
        try {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          let output = '';
          str = String(str).replace(/=+$/, '');
          for (let bc = 0, bs = 0, buffer, idx = 0; (buffer = str.charAt(idx++)); ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4) ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)))) : 0) {
            buffer = chars.indexOf(buffer);
          }
          return output;
        } catch {
          return '';
        }
      };
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(decodeBase64(base64));
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
        SecureStore.deleteItemAsync("user_mpin"),
        SecureStore.deleteItemAsync("user_biometric_mpin"),
        AsyncStorage.removeItem("userData"),
      ]);
      logger.log("✅ Authentication data cleared");
    } catch (error) {
      logger.error("❌ Error clearing authentication data:", error);
    }
  };

  const checkAuthenticationStatus = async () => {
    const minSplashWait = new Promise((resolve) => setTimeout(resolve, 1400));
    try {
      setAuthStatus("checking");
      logger.log("🔐 Starting authentication check...");

      // Check if user is already logged in from global state
      if (isLoggedIn && user) {
        logger.log("✅ User already logged in, checking redirect destination");
        setAuthStatus("navigating");
        const cache = useGlobalStore.getState().getCachedVisibility();
        if (cache && cache.data) {
          if (cache.data.showDashboardAfterLogin === 0) {
            logger.log("✅ Config dictates redirecting to home page");
            router.replace("/(app)/(tabs)/home");
            return;
          }
        } else {
          try {
            let token = await getSecureItemWithTimeout("authToken") || await getSecureItemWithTimeout("token") || await getSecureItemWithTimeout("accessToken");
            if (token) {
              logger.log("📡 Fetching visibility config in AuthGuard...");
              const visResponse = await apiClient.get('/app-visible', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (visResponse.data) {
                useGlobalStore.getState().setCachedVisibility(visResponse.data);
                if (visResponse.data.showDashboardAfterLogin === 0) {
                  logger.log("✅ Config dictates redirecting to home page (freshly fetched)");
                  router.replace("/(app)/(tabs)/home");
                  return;
                }
              }
            }
          } catch (e) {
            logger.error("Error fetching visibility config in AuthGuard:", e);
          }
        }
        router.replace("/(app)/dashboard");
        return;
      }

      setAuthStatus("validating");

      // Check for stored authentication token (try multiple token keys)
      let token = await getSecureItemWithTimeout("authToken");
      logger.log("🔍 Checking authToken:", token ? "EXISTS" : "NOT FOUND");

      if (!token) {
        token = await getSecureItemWithTimeout("token");
        logger.log("🔍 Checking token:", token ? "EXISTS" : "NOT FOUND");
      }
      if (!token) {
        token = await getSecureItemWithTimeout("accessToken");
        logger.log("🔍 Checking accessToken:", token ? "EXISTS" : "NOT FOUND");
      }

      if (!token) {
        logger.log("❌ No authentication token found, redirecting to login");
        setAuthStatus("navigating");
        await minSplashWait;
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
          await minSplashWait;
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
      <LinearGradient
        colors={["#850111", "#5A000B", "#2D0005"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <StatusBar barStyle="light-content" backgroundColor="#850111" />
        <Animated.View
          style={[
            styles.container,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Top Heritage & Offer Highlight Pill */}
          <View style={styles.topPromoPill}>
            <Text style={styles.topPromoText}>
              ✨ 916 BIS HALLMARKED GOLD • DIGITAL CHIT SAVINGS ✨
            </Text>
          </View>

          {/* Royal Gold-Glow Squircle Frame */}
          <View style={styles.medallion}>
            <Image
              source={resolveImageSource(theme?.images?.auth?.logo || theme?.image?.transparentLogo, logoTransImage)}
              style={{ width: 168, height: 168 }}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.brandTitle}>
            {(theme?.constants?.customerName || "Sri Murugan Gold House").toUpperCase()}
          </Text>
          <Text style={styles.brandTagline}>Generations of Trust</Text>

          {/* Bottom Promotional Highlights Strip */}
          <View style={styles.bottomPromoCard}>
            <View style={styles.promoItem}>
              <Text style={styles.promoTitle}>11 Months</Text>
              <Text style={styles.promoSub}>Easy Plans</Text>
            </View>
            <View style={styles.promoDivider} />
            <View style={styles.promoItem}>
              <Text style={styles.promoTitle}>0% Wastage</Text>
              <Text style={styles.promoSub}>Bonus Value</Text>
            </View>
            <View style={styles.promoDivider} />
            <View style={styles.promoItem}>
              <Text style={styles.promoTitle}>100% Safe</Text>
              <Text style={styles.promoSub}>Live Passbook</Text>
            </View>
          </View>

          <ActivityIndicator
            size="large"
            color={authStatus === "error" ? COLORS.error : "#FFDF00"}
            style={styles.loader}
          />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </Animated.View>
      </LinearGradient>
    );
  }

  // This should not render as we're redirecting
  return null;
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  medallion: {
    width: 168,
    height: 168,
    borderRadius: 36,
    backgroundColor: "#5A000B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  brandTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 1.4,
    textAlign: "center",
    marginBottom: 4,
  },
  brandTagline: {
    color: "#FFDF00",
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: 0.6,
    marginBottom: 22,
  },
  topPromoPill: {
    backgroundColor: "rgba(212, 175, 55, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 223, 0, 0.45)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginBottom: 24,
  },
  topPromoText: {
    color: "#FDE68A",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.9,
    textAlign: "center",
  },
  bottomPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.35)",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    width: "100%",
    maxWidth: 340,
    marginBottom: 24,
  },
  promoItem: {
    flex: 1,
    alignItems: "center",
  },
  promoTitle: {
    color: "#FFDF00",
    fontSize: 12.5,
    fontWeight: "800",
  },
  promoSub: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 2,
  },
  promoDivider: {
    width: 1,
    height: 26,
    backgroundColor: "rgba(212, 175, 55, 0.3)",
  },
  loader: {
    marginTop: 8,
  },
  statusText: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
    opacity: 0.9,
  },
});

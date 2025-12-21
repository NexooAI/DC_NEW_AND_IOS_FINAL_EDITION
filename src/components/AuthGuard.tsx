import React, { useEffect, useState, useMemo } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import useGlobalStore from "@/store/global.store";
import * as SecureStore from "expo-secure-store";
import { theme } from "@/constants/theme";
import { COLORS } from "src/constants/colors";

import { logger } from "@/utils/logger";
interface AuthGuardProps {
  children: React.ReactNode;
  requireMpinVerification?: boolean;
}

export default function AuthGuard({
  children,
  requireMpinVerification = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { isLoggedIn, user, logout } = useGlobalStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Memoize authentication state to prevent unnecessary re-renders
  const authState = useMemo(
    () => ({
      isLoggedIn,
      userId: user?.id,
      hasUser: !!user,
    }),
    [isLoggedIn, user?.id, !!user]
  );

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const checkAuthentication = async () => {
      try {
        // Check if user is logged in
        if (!authState.isLoggedIn) {
          logger.log("AuthGuard: User not logged in, redirecting to login");
          if (isMounted) {
            router.replace("/(auth)/login");
          }
          return;
        }

        // Check if user data exists - be more lenient
        if (!authState.hasUser) {
          logger.log(
            "AuthGuard: No user data, but not logging out automatically"
          );
          // Don't automatically logout - let user continue
          if (isMounted) {
            setIsAuthenticated(true);
          }
          return;
        }

        // Check if auth token exists and is valid - be more lenient
        const token = await SecureStore.getItemAsync("authToken");
        if (!token) {
          logger.log(
            "AuthGuard: No auth token, but not logging out automatically"
          );
          // Don't automatically logout - let user continue
          if (isMounted) {
            setIsAuthenticated(true);
          }
          return;
        }

        // Check if user just completed registration (has fresh token)
        const registrationTimestamp = await SecureStore.getItemAsync(
          "registrationTimestamp"
        );
        if (registrationTimestamp) {
          const registrationTime = parseInt(registrationTimestamp);
          const currentTime = Date.now();
          // If registration was completed within last 5 minutes, bypass MPIN verification
          if (currentTime - registrationTime < 300000) {
            // 5 minutes
            logger.log(
              "AuthGuard: User just completed registration, bypassing MPIN verification"
            );
            if (isMounted) {
              setIsAuthenticated(true);
            }
            return;
          }
        }

        // Validate token expiration - be more lenient
        const tokenParts = token.split(".");
        if (tokenParts.length !== 3) {
          logger.log(
            "AuthGuard: Invalid token format, but not logging out automatically"
          );
          // Don't automatically logout for invalid token format
          if (isMounted) {
            setIsAuthenticated(true);
          }
          return;
        }

        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          const currentTime = Date.now() / 1000;

          // Check if token is expired (with 5 minute buffer for better UX)
          if (payload.exp && payload.exp < currentTime + 300) {
            logger.log(
              "AuthGuard: Token expired or close to expiring, redirecting to MPIN verification"
            );
            if (isMounted) {
              if (requireMpinVerification) {
                router.replace("/(auth)/mpin_verify");
              } else {
                // Don't automatically logout - let user continue
                setIsAuthenticated(true);
              }
            }
            return;
          }
        } catch (error) {
          logger.log(
            "AuthGuard: Error parsing token, but not logging out automatically"
          );
          // Don't automatically logout on parsing error
          if (isMounted) {
            setIsAuthenticated(true);
          }
          return;
        }

        // All checks passed, user is authenticated
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        logger.error(
          "AuthGuard: Authentication check error, but not logging out automatically"
        );
        // Don't automatically logout on error
        if (isMounted) {
          setIsAuthenticated(true);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [authState, router, logout, requireMpinVerification]);

  // Show loading screen while checking authentication
  if (isChecking || !isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Verifying authentication...</Text>
      </View>
    );
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.black,
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 20,
    fontSize: 16,
    fontWeight: "600",
  },
});

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import * as SecureStore from "expo-secure-store";

import { logger } from "@/utils/logger";
type AuthContextType = {
  user: null | { id: string; email: string };
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any, tokens: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async (userData: any, tokens: any) => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<null | { id: string; email: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkAuth = async () => {
      try {
        const userData = await SecureStore.getItemAsync("user");
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        logger.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Implement your login logic here
    // const dummyUser = { id: '1', email };
    // await SecureStore.setItemAsync('user', JSON.stringify(dummyUser));
    // setUser(dummyUser);
    logger.log("AuthContext login called but not implemented");
  };

  const register = async (userData: any, tokens: any) => {
    try {
      // Store user data and tokens securely
      // const userInfo = {
      //   id: userData.id || '1',
      //   email: userData.email,
      //   mobile: userData.mobile_number,
      //   profile_photo: userData.profile_photo,
      //   mpinStatus: userData.mpinStatus,
      //   usertype: userData.usertype,
      // };

      // await SecureStore.setItemAsync('user', JSON.stringify(userInfo));
      // await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      // await SecureStore.setItemAsync('token', tokens.token);
      // await SecureStore.setItemAsync('refreshToken', tokens.refreshtoken);

      // setUser(userInfo);
      logger.log("AuthContext register called but not implemented");
    } catch (error) {
      logger.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      logger.log("🚪 AuthContext logout initiated");

      // Clear local user state
      setUser(null);

      logger.log("✅ AuthContext logout completed");
    } catch (error) {
      logger.error("❌ Error during AuthContext logout:", error);
      // Even if there's an error, clear the user state
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import { APP_CONFIG } from "@/constants";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { useBiometrics } from "@/hooks/useBiometrics";
import { useOtpAutoFetch } from "@/hooks/useOtpAutoFetch";
import { logger } from "@/utils/logger";

export type AuthStep = "phone" | "otp" | "mpin" | "set_mpin" | "register";
export type OtpChannel = "sms" | "whatsapp";

export interface UseAuthLogicProps {
  initialStep?: AuthStep;
  initialMobile?: string;
}

export function useAuthLogic({
  initialStep = "phone",
  initialMobile = "",
}: UseAuthLogicProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useGlobalStore();

  const [step, setStep] = useState<AuthStep>(initialStep);
  const [mobile, setMobile] = useState<string>(initialMobile);
  const [otp, setOtp] = useState<string>("");
  const [mpin, setMpin] = useState<string>("");
  const [confirmMpin, setConfirmMpin] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");
  const [channel, setChannel] = useState<OtpChannel>("sms");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(30);
  const [resendAttempts, setResendAttempts] = useState<number>(3);
  const [savedUserMobile, setSavedUserMobile] = useState<string>("");
  const [showInvalidModal, setShowInvalidModal] = useState<boolean>(false);
  const [invalidMobileNumber, setInvalidMobileNumber] = useState<string>("");
  const [isResetMpin, setIsResetMpin] = useState<boolean>(false);

  const {
    isSupported,
    isEnrolled,
    isEnabled,
    authenticate,
    enableBiometrics,
  } = useBiometrics();

  // Load any previously saved user data or mobile
  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        if (userDataStr) {
          const u = JSON.parse(userDataStr);
          if (u?.mobile_number || u?.mobile) {
            const m = u.mobile_number || u.mobile;
            setSavedUserMobile(m);
            if (initialStep === "mpin" && !initialMobile) {
              setMobile(m);
            }
          }
        }
      } catch (err) {
        logger.warn("Failed to load saved user in useAuthLogic:", err);
      }
    };
    loadSavedUser();
  }, [initialStep, initialMobile]);

  // Sync mobile when transitioning to MPIN step if currently blank
  useEffect(() => {
    if (step === "mpin" && !mobile && savedUserMobile) {
      setMobile(savedUserMobile);
    }
  }, [step, mobile, savedUserMobile]);

  // OTP Countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Auto-read OTP (Android SMS Retriever)
  useOtpAutoFetch({
    onOtpReceived: (receivedOtp: string) => {
      const clean = receivedOtp.slice(0, 4);
      setOtp(clean);
      if (clean.length === 4) {
        verifyOtp(clean);
      }
    },
    isActive: step === "otp",
  });

  const clearError = () => setError(null);

  // Navigate post-login
  const handlePostLoginRedirect = async (token: string, userData: any) => {
    try {
      const visResponse = await api.get("/app-visible", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (visResponse.data) {
        useGlobalStore.getState().setCachedVisibility(visResponse.data);
        if (visResponse.data.showDashboardAfterLogin === 0) {
          router.replace("/(app)/(tabs)/home");
          return;
        }
      }
    } catch (e) {
      logger.warn("Failed to check app-visible after login:", e);
    }
    router.replace("/(app)/(tabs)/home");
  };

  // 1. Send OTP
  const sendOtp = async (customMobile?: string): Promise<boolean> => {
    const targetMobile = (customMobile || mobile).trim();
    const indianMobilePattern = /^[6-9]\d{9}$/;

    if (!targetMobile) {
      setError(t("pleaseEnterMobile") || "Please enter mobile number");
      return false;
    }
    if (!indianMobilePattern.test(targetMobile)) {
      setError(t("valid10DigitIndianMobile") || "Enter valid 10-digit mobile number");
      return false;
    }

    setMobile(targetMobile);
    clearError();
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/check-mobile",
        { mobile_number: targetMobile },
        { validateStatus: () => true, skipLoading: true } as any
      );

      const data = response.data;

      if (response.status >= 200 && response.status < 300 && data?.success !== false) {
        setStep("otp");
        setTimer(30);
        setResendAttempts(3);
        setOtp("");
        return true;
      } else {
        const errorMsg = data?.error || data?.message || t("failedToSendOtp");
        const lowerMsg = (errorMsg || "").toLowerCase();
        // Check if unregistered
        if (
          lowerMsg.includes("not registered") ||
          lowerMsg.includes("invalid mobile number") ||
          lowerMsg.includes("not found") ||
          lowerMsg.includes("user not found") ||
          lowerMsg.includes((t("invalidMobileNumber") || "").toLowerCase()) ||
          lowerMsg.includes((t("youAreNotRegistered") || "").toLowerCase())
        ) {
          setInvalidMobileNumber(targetMobile);
          setShowInvalidModal(true);
          return false;
        }
        setError(errorMsg);
        return false;
      }
    } catch (err: any) {
      logger.error("Error sending OTP:", err);
      setError(err?.response?.data?.message || err?.message || t("anUnexpectedError") || "Failed to send OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 2. Resend OTP
  const resendOtp = async () => {
    if (resendAttempts <= 0) {
      Alert.alert(t("error"), t("resendLimitReached") || "Resend limit reached");
      return;
    }
    setLoading(true);
    clearError();
    try {
      const response = await api.post(
        "/auth/check-mobile",
        { mobile_number: mobile },
        { validateStatus: () => true, skipLoading: true } as any
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300 && data?.success !== false) {
        const nextTimer = resendAttempts === 3 ? 60 : 120;
        setResendAttempts((prev) => prev - 1);
        setTimer(nextTimer);
        setOtp("");
        Alert.alert(t("success"), t("otpResentSuccess") || "OTP resent successfully");
      } else {
        setError(data?.error || data?.message || t("failedToResendOtp"));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t("failedToResendOtp"));
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify OTP
  const verifyOtp = async (customOtp?: string): Promise<boolean> => {
    const targetOtp = (customOtp || otp).trim();
    if (!targetOtp || targetOtp.length !== 4) {
      setError(t("pleaseEnterCompleteOtp") || "Please enter valid 4-digit OTP");
      return false;
    }

    clearError();
    setLoading(true);

    try {
      const response = await api.post(
        "/auth/verify-otp",
        {
          mobile_number: mobile,
          otp: targetOtp,
        },
        { validateStatus: () => true, skipLoading: true } as any
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300 && data?.success && data?.token) {
        // Store tokens
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken || data.token);
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshtoken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        }
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        const userPayload = {
          id: data.user.user_id || data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          mobile: data.user.mobile_number || data.user.mobile || mobile,
          referralCode: data.user.referralCode || "",
          profile_photo: data.user.profile_photo || "",
          mpinStatus: data.user.mpinStatus || false,
          usertype: data.user.userType || data.user.usertype || "",
        };

        login(data.token, userPayload);

        // If reset mode or user doesn't have MPIN set yet, go to set_mpin
        if (isResetMpin || !data.user?.mpinStatus) {
          setStep("set_mpin");
        } else {
          setStep("mpin");
        }
        return true;
      } else {
        setError(data?.message || data?.error || t("invalidOtp") || "Invalid OTP");
        return false;
      }
    } catch (err: any) {
      logger.error("Error verifying OTP:", err);
      setError(err?.response?.data?.message || err?.message || t("anUnexpectedError") || "Verification failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 4. Login with MPIN
  const loginWithMpin = async (customMpin?: string): Promise<boolean> => {
    const targetMpin = (customMpin || mpin).trim();
    let targetMobile = (mobile || savedUserMobile || "").trim();

    if (!targetMobile) {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        if (userDataStr) {
          const u = JSON.parse(userDataStr);
          targetMobile = (u?.mobile_number || u?.mobile || "").trim();
        }
      } catch (e) {
        logger.warn("Error reading mobile from storage:", e);
      }
    }

    if (!targetMobile) {
      setError(t("pleaseEnterMobile") || "Mobile number not found");
      return false;
    }

    clearError();
    setLoading(true);

    try {
      const response = await api.post("/auth/login-mpin", {
        mobileNumber: targetMobile,
        mpin: targetMpin,
      });

      const data = response.data;
      const isSuccess = data?.success || data?.status === "success" || response.status === 200;

      if (isSuccess && data?.token && data?.user) {
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken || data.token);
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshtoken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        }
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        const userPayload = {
          id: data.user.user_id || data.user.id,
          name: data.user.name || "",
          email: data.user.email || "",
          mobile: data.user.mobile_number || data.user.mobile || targetMobile,
          referralCode: data.user.referralCode || "",
          profile_photo: data.user.profile_photo || "",
          mpinStatus: data.user.mpinStatus || false,
          usertype: data.user.userType || data.user.usertype || "",
          branch_id: data.user.branch_id ?? null,
          allow_multi_branch: data.user.allow_multi_branch ?? null,
        };

        login(data.token, userPayload);
        await handlePostLoginRedirect(data.token, data.user);
        return true;
      } else {
        setError(data?.message || data?.msg || t("invalidOtp") || "Invalid MPIN");
        return false;
      }
    } catch (err: any) {
      logger.error("Error logging in with MPIN:", err);
      const msg = err?.response?.data?.message || err?.message || t("anUnexpectedError") || "MPIN login failed";
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 5. Biometric Login
  const handleBiometricAuth = async () => {
    if (loading || !isEnabled) return;
    try {
      const result = await authenticate();
      if (result.success && result.mpin) {
        await loginWithMpin(result.mpin);
      }
    } catch (err) {
      logger.warn("Biometric authentication error:", err);
    }
  };

  // 6. Submit Registration (UserBasicDetails initiate)
  const submitRegister = async (): Promise<boolean> => {
    if (!name.trim()) {
      setError(t("fullNamePlaceholder") || "Please enter your name");
      return false;
    }
    const targetMobile = mobile.trim();
    const indianMobilePattern = /^[6-9]\d{9}$/;
    if (!indianMobilePattern.test(targetMobile)) {
      setError(t("valid10DigitIndianMobile") || "Enter valid 10-digit mobile number");
      return false;
    }

    clearError();
    setLoading(true);
    try {
      const response = await api.post(
        "/register/mobile",
        { mobile_number: targetMobile },
        { validateStatus: () => true, skipLoading: true } as any
      );

      const data = response.data;
      if (response.status >= 200 && response.status < 300) {
        setStep("otp");
        setTimer(30);
        setResendAttempts(3);
        setOtp("");
        return true;
      } else {
        setError(data?.error || data?.message || t("failedToSendOtp"));
        return false;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 7. Submit Set MPIN
  const submitSetMpin = async (): Promise<boolean> => {
    if (!mpin || mpin.length !== 4) {
      setError(t("enterMpinTitle") || "Enter 4-digit MPIN");
      return false;
    }
    if (mpin !== confirmMpin) {
      setError(t("mpinMismatch") || "MPINs do not match");
      return false;
    }

    clearError();
    setLoading(true);

    try {
      const response = await api.post("/register/set-mpin", {
        name,
        email,
        mobile_number: mobile,
        mpin,
        password: mpin,
        referral_code: referralCode,
      });

      const data = response.data;
      if (data?.success && data?.token) {
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken || data.token);
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshtoken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        }
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        login(data.token, {
          id: data.user.user_id,
          name: data.user.name,
          email: data.user.email,
          mobile: data.user.mobile_number,
          referralCode: data.user.referralCode,
          profile_photo: data.user.profile_photo,
          mpinStatus: data.user.mpinStatus,
          usertype: data.user.userType,
        });

        // Prompt biometric enrollment if supported
        if (isSupported && isEnrolled) {
          try {
            await enableBiometrics(mpin);
          } catch (bioErr) {
            logger.warn("Biometrics enrollment skipped:", bioErr);
          }
        }

        await handlePostLoginRedirect(data.token, data.user);
        return true;
      } else {
        setError(data?.message || t("registrationFailed") || "Failed to set MPIN");
        return false;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to set MPIN");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const changeNumber = () => {
    setOtp("");
    setMpin("");
    setConfirmMpin("");
    setIsResetMpin(false);
    clearError();
    setStep("phone");
  };

  const startForgotMpin = async () => {
    setIsResetMpin(true);
    let targetMobile = (mobile || savedUserMobile || "").trim();
    if (!targetMobile) {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        if (userDataStr) {
          const u = JSON.parse(userDataStr);
          targetMobile = (u?.mobile_number || u?.mobile || "").trim();
        }
      } catch (e) {
        logger.warn("Error reading mobile in startForgotMpin:", e);
      }
    }
    if (targetMobile) {
      setMobile(targetMobile);
      return sendOtp(targetMobile);
    } else {
      setStep("phone");
      return false;
    }
  };

  const closeInvalidModal = () => {
    setShowInvalidModal(false);
  };

  const goToRegister = (customMobile?: string) => {
    clearError();
    setShowInvalidModal(false);
    const targetMobile = (customMobile || invalidMobileNumber || mobile).trim();
    router.push({
      pathname: "/(auth)/userBasicDetails",
      params: targetMobile ? { mobile: targetMobile } : {},
    });
  };

  const goToLogin = () => {
    clearError();
    setIsResetMpin(false);
    setStep("phone");
  };

  return {
    step,
    setStep,
    mobile,
    setMobile,
    otp,
    setOtp,
    mpin,
    setMpin,
    confirmMpin,
    setConfirmMpin,
    name,
    setName,
    email,
    setEmail,
    referralCode,
    setReferralCode,
    channel,
    setChannel,
    loading,
    error,
    clearError,
    timer,
    resendAttempts,
    showInvalidModal,
    setShowInvalidModal,
    closeInvalidModal,
    invalidMobileNumber,
    isResetMpin,
    setIsResetMpin,
    isBiometricsAvailable: isSupported && isEnrolled,
    isBiometricsEnabled: isEnabled,
    handleBiometricAuth,
    sendOtp,
    resendOtp,
    verifyOtp,
    loginWithMpin,
    submitRegister,
    submitSetMpin,
    changeNumber,
    startForgotMpin,
    goToRegister,
    goToLogin,
  };
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Alert, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "@/services/api";
import { APP_CONFIG } from "@/constants";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { fetchBranchesWithCache } from "@/utils/apiCache";
import { logger } from "@/utils/logger";

export type RegisterStep = "form" | "otp" | "mpin";

export interface UseRegisterLogicProps {
  initialMobile?: string;
  initialReferral?: string;
}

export function useRegisterLogic({
  initialMobile = "",
  initialReferral = "",
}: UseRegisterLogicProps = {}) {
  const router = useRouter();
  const { t } = useTranslation();
  const { login } = useGlobalStore();

  const [step, setStep] = useState<RegisterStep>("form");
  const [mobile, setMobile] = useState<string>(initialMobile);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [isBranchDisabled, setIsBranchDisabled] = useState<boolean>(false);

  const [referralCode, setReferralCode] = useState<string>(initialReferral);
  const [isReferralValidating, setIsReferralValidating] = useState<boolean>(false);
  const [isReferralValidated, setIsReferralValidated] = useState<boolean>(false);
  const [referralMessage, setReferralMessage] = useState<string>("");

  const [otp, setOtp] = useState<string>("");
  const [mpin, setMpin] = useState<string>("");
  const [confirmMpin, setConfirmMpin] = useState<string>("");

  const [timer, setTimer] = useState<number>(30);
  const [resendCount, setResendCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const referralDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load branch list
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const list = (await fetchBranchesWithCache()) || [];
        setBranches(list);
      } catch (err) {
        logger.error("Error fetching branches in useRegisterLogic:", err);
      }
    };
    loadBranches();
  }, []);

  // Set initial mobile if passed
  useEffect(() => {
    if (initialMobile && initialMobile.length === 10) {
      setMobile(initialMobile);
    }
  }, [initialMobile]);

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

  const clearError = () => setError(null);

  // Referral code validation
  const validateReferralWithAPI = async (code: string) => {
    if (!code || code.length !== 6) return;
    setIsReferralValidating(true);
    setIsReferralValidated(false);
    setReferralMessage("");

    try {
      const response = await api.get(
        `/auth/referrals/${code}`,
        { validateStatus: () => true, skipLoading: true } as any
      );
      const data = response.data;

      if ((response.status === 200 || response.status === 304) && data?.valid) {
        setIsReferralValidated(true);
        setReferralMessage(t("validReferralCode") || "Valid referral code");
        if (data?.referrer?.branch_id) {
          setSelectedBranchId(Number(data.referrer.branch_id));
          setIsBranchDisabled(true);
        } else {
          setIsBranchDisabled(false);
        }
      } else {
        setIsReferralValidated(false);
        setReferralMessage(data?.message || t("invalidReferralCodeFormat") || "Invalid referral code");
      }
    } catch (err) {
      logger.error("Referral validation error:", err);
      setIsReferralValidated(false);
      setReferralMessage(t("checkInternetConnection") || "Failed to validate referral");
    } finally {
      setIsReferralValidating(false);
    }
  };

  const handleReferralChange = (text: string) => {
    const formatted = text.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
    setReferralCode(formatted);
    setIsReferralValidated(false);
    setReferralMessage("");
    setIsBranchDisabled(false);

    if (referralDebounceRef.current) {
      clearTimeout(referralDebounceRef.current);
    }

    if (formatted.length === 6) {
      referralDebounceRef.current = setTimeout(() => {
        validateReferralWithAPI(formatted);
      }, 500);
    }
  };

  // Submit initial registration form -> Send OTP
  const submitForm = async (): Promise<boolean> => {
    Keyboard.dismiss();
    clearError();

    const cleanMobile = mobile.trim();
    if (!cleanMobile || !/^[6-9]\d{9}$/.test(cleanMobile)) {
      setError(t("valid10DigitIndianMobile") || "Enter valid 10-digit mobile number");
      return false;
    }
    if (!name.trim() || name.trim().length < 2) {
      setError(t("nameMustBeAtLeast2Characters") || "Name must be at least 2 characters");
      return false;
    }
    if (!email.trim() || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim())) {
      setError(t("pleaseEnterAValidEmailAddress") || "Please enter a valid email address");
      return false;
    }
    if (!selectedBranchId) {
      setError(t("selectBranch") || "Please select a branch");
      return false;
    }
    if (referralCode && referralCode.length === 6 && !isReferralValidated) {
      setError(t("pleaseWaitForReferralCodeValidation") || "Please enter a valid referral code or remove it");
      return false;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/register/mobile",
        { mobile_number: cleanMobile },
        { validateStatus: () => true, skipLoading: true } as any
      );
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        setStep("otp");
        setTimer(30);
        setOtp("");
        return true;
      } else {
        const errorMsg = data?.error || data?.message || t("failedToSendOtp");
        if (
          errorMsg.toLowerCase().includes("already registered") ||
          errorMsg.toLowerCase().includes("already exists") ||
          errorMsg.toLowerCase().includes("account exists")
        ) {
          Alert.alert(
            t("accountExists") || "Account Exists",
            t("accountExistsMessage") || "This mobile number is already registered. Please login.",
            [
              { text: t("login") || "Login", onPress: () => router.replace("/(auth)/login") },
              { text: t("cancel") || "Cancel", style: "cancel" },
            ]
          );
        } else {
          setError(errorMsg);
        }
        return false;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t("failedToSendOtp") || "Failed to send OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async (customOtp?: string): Promise<boolean> => {
    Keyboard.dismiss();
    const targetOtp = (customOtp || otp).trim();
    if (!targetOtp || targetOtp.length !== 4) {
      setError(t("pleaseEnter4DigitOtp") || "Please enter valid 4-digit OTP");
      return false;
    }

    clearError();
    setLoading(true);
    try {
      const response = await api.post(
        "/register/verify-otp",
        { mobile_number: mobile.trim(), otp: targetOtp },
        { validateStatus: () => true, skipLoading: true } as any
      );
      const data = response.data;

      if (response.status >= 200 && response.status < 300 && (data?.message?.toLowerCase().includes("otp verified successfully") || data?.success)) {
        setStep("mpin");
        return true;
      } else {
        setError(data?.error || data?.message || t("invalidOtpOrOtpExpired") || "Invalid OTP");
        return false;
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t("failedToVerifyOtp") || "Failed to verify OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (loading || timer > 0) return;
    setLoading(true);
    clearError();

    try {
      const response = await api.post(
        "/register/mobile",
        { mobile_number: mobile.trim() },
        { validateStatus: () => true, skipLoading: true } as any
      );
      const data = response.data;

      if (response.status >= 200 && response.status < 300) {
        const nextTimer = resendCount === 0 ? 60 : 120;
        setResendCount((prev) => prev + 1);
        setTimer(nextTimer);
        setOtp("");
        Alert.alert(t("success") || "Success", t("otpSentSuccessfully") || "OTP resent successfully");
      } else {
        setError(data?.error || data?.message || t("failedToSendOtp"));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t("failedToSendOtp"));
    } finally {
      setLoading(false);
    }
  };

  // Submit MPIN and finalize registration
  const submitMpin = async (): Promise<boolean> => {
    Keyboard.dismiss();
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
      const payload = {
        name: name.trim(),
        email: email.trim(),
        mobile_number: mobile.trim(),
        mpin,
        password: mpin,
        referral_code: referralCode || "",
        branch_id: selectedBranchId ? Number(selectedBranchId) : null,
      };

      const response = await api.post("/register/complete", payload);
      const data = response.data;

      if (response.status === 200 && data?.token && data?.user) {
        await SecureStore.setItemAsync("authToken", data.token);
        await SecureStore.setItemAsync("accessToken", data.accessToken || data.token);
        await SecureStore.setItemAsync("token", data.token);
        if (data.refreshtoken) {
          await SecureStore.setItemAsync("refreshToken", data.refreshtoken);
        }
        await AsyncStorage.setItem("userData", JSON.stringify(data.user));

        login(data.token, {
          id: data.user.user_id || data.user.id,
          name: data.user.name,
          email: data.user.email,
          mobile: data.user.mobile_number,
          referralCode: data.user.referralCode,
          profile_photo: data.user.profile_photo,
          mpinStatus: data.user.mpinStatus,
          usertype: data.user.userType,
        });

        // App visible config
        try {
          const vis = await api.get("/app-visible", {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (vis.data) {
            useGlobalStore.getState().setCachedVisibility(vis.data);
            if (vis.data.showDashboardAfterLogin === 0) {
              router.replace("/(app)/(tabs)/home");
              return true;
            }
          }
        } catch (visErr) {
          logger.warn("Visibility check in register:", visErr);
        }

        router.replace("/(app)/(tabs)/home");
        return true;
      } else {
        setError(data?.message || t("registrationFailed") || "Registration failed");
        return false;
      }
    } catch (err: any) {
      logger.error("Complete registration error:", err);
      setError(err?.response?.data?.message || err?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.replace("/(auth)/login");
  };

  return {
    step,
    setStep,
    mobile,
    setMobile,
    name,
    setName,
    email,
    setEmail,
    selectedBranchId,
    setSelectedBranchId,
    branches,
    isBranchDisabled,
    referralCode,
    handleReferralChange,
    isReferralValidating,
    isReferralValidated,
    referralMessage,
    otp,
    setOtp,
    mpin,
    setMpin,
    confirmMpin,
    setConfirmMpin,
    timer,
    resendCount,
    loading,
    error,
    clearError,
    submitForm,
    verifyOtp,
    resendOtp,
    submitMpin,
    goToLogin,
  };
}

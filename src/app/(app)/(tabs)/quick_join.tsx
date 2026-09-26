import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { moderateScale } from 'react-native-size-matters';
import * as Haptics from 'expo-haptics';
import { useTranslation } from '@/hooks/useTranslation';
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import api from '@/services/api';
import { fetchSchemesWithCache, fetchBranchesWithCache } from '@/utils/apiCache';
import { formatGoldWeight } from '@/utils/imageUtils';
import { logger } from '@/utils/logger';
import {
  getSchemeMetalType,
  getSchemeInterestSlabs,
  getSchemeTypeLabel,
} from './home/schemes';

const ENDPOINTS = {
  HOME: '/home',
  SCHEME_AMOUNT_LIMIT: '/amount-limits/scheme',
  BRANCHES: '/branches',
  INVESTMENTS: '/investments'
};

const safeHaptic = (style: Haptics.ImpactFeedbackStyle) => {
  if (process.env.NODE_ENV !== "test" && Platform.OS !== "web") {
    try {
      Haptics?.impactAsync?.(style)?.catch?.(() => {});
    } catch {}
  }
};

const getMetalIconSource = (metal: string) => {
  switch (metal) {
    case "silver":
      return require("../../../../assets/images/silver_coin_badge.png");
    case "diamond":
      return require("../../../../assets/images/diamond_coin_badge.png");
    case "old_gold":
      return require("../../../../assets/images/gold.png");
    case "gold":
    default:
      return require("../../../../assets/images/luxury_gold_coin.png");
  }
};

const getSchemeDisplayImage = (scheme: any, metal: string) => {
  if (scheme?.IMAGE && typeof scheme.IMAGE === 'string' && (scheme.IMAGE.startsWith('http') || scheme.IMAGE.startsWith('/'))) {
    return { uri: scheme.IMAGE };
  }
  if (scheme?.ICON && typeof scheme.ICON === 'string' && (scheme.ICON.startsWith('http') || scheme.ICON.startsWith('/'))) {
    return { uri: scheme.ICON };
  }
  return getMetalIconSource(metal);
};

const getSchemeCardTheme = (metal: string, isActive: boolean) => {
  if (isActive) {
    return {
      gradient: ["#5B0E2D", "#2B0413"] as [string, string],
      borderColor: "#FFD700",
      badgeBg: "rgba(255, 215, 0, 0.22)",
      badgeBorder: "rgba(255, 215, 0, 0.5)",
      badgeText: "#FFD700",
      titleColor: "#FFFFFF",
      iconGlow: "rgba(255, 215, 0, 0.15)",
      radioColor: "#FFD700",
      pillBg: "rgba(255, 255, 255, 0.16)",
      pillText: "#FFFFFF",
    };
  }

  switch (metal) {
    case "silver":
      return {
        gradient: ["#FFFFFF", "#F1F5F9"] as [string, string],
        borderColor: "#CBD5E1",
        badgeBg: "rgba(148, 163, 184, 0.16)",
        badgeBorder: "rgba(148, 163, 184, 0.4)",
        badgeText: "#334155",
        titleColor: "#0F172A",
        iconGlow: "rgba(148, 163, 184, 0.15)",
        radioColor: "#94A3B8",
        pillBg: "#F1F5F9",
        pillText: "#475569",
      };
    case "diamond":
      return {
        gradient: ["#FFFFFF", "#F0F9FF"] as [string, string],
        borderColor: "#BAE6FD",
        badgeBg: "rgba(56, 189, 248, 0.16)",
        badgeBorder: "rgba(56, 189, 248, 0.4)",
        badgeText: "#0369A1",
        titleColor: "#0F172A",
        iconGlow: "rgba(56, 189, 248, 0.15)",
        radioColor: "#38BDF8",
        pillBg: "#E0F2FE",
        pillText: "#0369A1",
      };
    case "old_gold":
      return {
        gradient: ["#FFFFFF", "#FFFBEB"] as [string, string],
        borderColor: "#FDE68A",
        badgeBg: "rgba(245, 158, 11, 0.16)",
        badgeBorder: "rgba(245, 158, 11, 0.4)",
        badgeText: "#B45309",
        titleColor: "#0F172A",
        iconGlow: "rgba(245, 158, 11, 0.15)",
        radioColor: "#F59E0B",
        pillBg: "#FEF3C7",
        pillText: "#B45309",
      };
    case "gold":
    default:
      return {
        gradient: ["#FFFFFF", "#FFFDF5"] as [string, string],
        borderColor: "#FDE68A",
        badgeBg: "rgba(212, 175, 55, 0.14)",
        badgeBorder: "rgba(212, 175, 55, 0.35)",
        badgeText: "#8A5800",
        titleColor: "#0F172A",
        iconGlow: "rgba(255, 215, 0, 0.15)",
        radioColor: "#CBD5E1",
        pillBg: "#FFF9E6",
        pillText: "#8A5800",
      };
  }
};

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      height: '92%',
      backgroundColor: COLORS.white,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 20,
    },
    sheetHandle: {
      width: moderateScale(38),
      height: moderateScale(4),
      borderRadius: moderateScale(2),
      backgroundColor: '#CBD5E1',
      alignSelf: 'center',
      marginTop: moderateScale(10),
      marginBottom: -moderateScale(6),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: moderateScale(20),
      paddingTop: moderateScale(18),
      paddingBottom: moderateScale(14),
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
      backgroundColor: COLORS.white,
    },
    headerIconCircle: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      backgroundColor: 'rgba(133, 1, 17, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: moderateScale(12),
    },
    headerContent: {
      flex: 1,
    },
    title: {
      fontSize: moderateScale(20),
      fontWeight: '800',
      color: COLORS.text.dark,
      letterSpacing: -0.3,
    },
    subtitle: {
      fontSize: moderateScale(12.5),
      color: COLORS.text.mediumGrey,
      marginTop: moderateScale(2),
      fontWeight: '500',
    },
    closeButton: {
      marginLeft: moderateScale(12),
    },
    closeButtonContainer: {
      width: moderateScale(34),
      height: moderateScale(34),
      borderRadius: moderateScale(17),
      backgroundColor: '#F1F5F9',
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(16),
    },

    /* Beautified Scheme Selector Styles */
    schemeSelectorContainer: {
      marginBottom: moderateScale(20),
    },
    schemeSelectorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: moderateScale(10),
    },
    schemeSelectorLabel: {
      fontSize: moderateScale(15),
      fontWeight: '700',
      color: '#0F172A',
      letterSpacing: 0.2,
    },
    schemeCountBadge: {
      fontSize: moderateScale(11.5),
      fontWeight: '600',
      color: '#64748B',
      backgroundColor: '#F1F5F9',
      paddingHorizontal: moderateScale(8),
      paddingVertical: moderateScale(2),
      borderRadius: moderateScale(10),
    },
    schemePillScroll: {
      flexGrow: 0,
      marginHorizontal: -moderateScale(20),
    },
    schemeCardsContainer: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(4),
      gap: moderateScale(12),
    },
    schemeCardTouch: {
      width: moderateScale(185),
    },
    schemeCard: {
      borderRadius: moderateScale(16),
      padding: moderateScale(12),
      minHeight: moderateScale(134),
      borderWidth: 1.5,
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 3,
    },
    schemeCardActiveGlow: {
      borderWidth: 2,
      shadowColor: '#850111',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 6,
    },
    schemeCardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: moderateScale(6),
    },
    schemeMetalBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(4),
      paddingHorizontal: moderateScale(7),
      paddingVertical: moderateScale(2.5),
      borderRadius: moderateScale(8),
      borderWidth: 1,
    },
    schemeMetalBadgeText: {
      fontSize: moderateScale(9.5),
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    schemeBonusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(3),
      paddingHorizontal: moderateScale(6),
      paddingVertical: moderateScale(2),
      borderRadius: moderateScale(6),
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(217, 119, 6, 0.3)',
    },
    schemeBonusBadgeActive: {
      backgroundColor: 'rgba(255, 215, 0, 0.22)',
      borderColor: 'rgba(255, 215, 0, 0.5)',
    },
    schemeBonusBadgeText: {
      fontSize: moderateScale(8.5),
      fontWeight: '800',
      color: '#D97706',
    },
    schemeBonusBadgeTextActive: {
      color: '#FFD700',
    },
    schemeRadioCircle: {
      marginLeft: 'auto',
    },
    schemeCardMiddleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(10),
      marginVertical: moderateScale(6),
    },
    schemeIconWrapper: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      justifyContent: 'center',
      alignItems: 'center',
    },
    schemeCoinImage: {
      width: moderateScale(34),
      height: moderateScale(34),
    },
    schemeNameWrapper: {
      flex: 1,
    },
    schemeCardName: {
      fontSize: moderateScale(13),
      fontWeight: '800',
      lineHeight: moderateScale(17),
      letterSpacing: 0.2,
    },
    schemeCardBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(6),
    },
    schemeInfoPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: moderateScale(4),
      paddingHorizontal: moderateScale(7),
      paddingVertical: moderateScale(3),
      borderRadius: moderateScale(8),
    },
    schemeInfoPillText: {
      fontSize: moderateScale(10.5),
      fontWeight: '700',
    },

    /* Form Section Styles */
    inputSection: {
      marginBottom: moderateScale(18),
    },
    inputLabel: {
      fontSize: moderateScale(14.5),
      fontWeight: '600',
      color: COLORS.darkGrey,
      marginBottom: moderateScale(8),
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: '#EFEFEF',
      borderRadius: moderateScale(14),
      paddingHorizontal: moderateScale(16),
      height: moderateScale(54),
    },
    textInput: {
      flex: 1,
      fontSize: moderateScale(15),
      color: COLORS.darkGrey,
      marginLeft: moderateScale(10),
      paddingVertical: moderateScale(8),
    },
    inputError: {
      borderColor: COLORS.error,
    },
    errorText: {
      color: COLORS.error,
      fontSize: moderateScale(12),
      marginTop: moderateScale(4),
      marginLeft: moderateScale(4),
    },
    amountHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: moderateScale(8),
    },
    limitText: {
      fontSize: moderateScale(12),
      color: theme.colors.textDark,
      fontWeight: '600',
    },
    currencySymbol: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      color: COLORS.mediumGrey,
      marginLeft: moderateScale(6),
    },
    goldWeightCard: {
      borderRadius: moderateScale(16),
      padding: moderateScale(14),
      marginBottom: moderateScale(20),
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    goldWeightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: moderateScale(6),
    },
    goldIconBg: {
      width: moderateScale(28),
      height: moderateScale(28),
      borderRadius: moderateScale(14),
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: moderateScale(8),
    },
    goldWeightLabel: {
      fontSize: moderateScale(13),
      color: COLORS.mediumGrey,
      marginLeft: moderateScale(6),
    },
    goldWeightValue: {
      fontSize: moderateScale(22),
      fontWeight: '800',
      color: COLORS.text.dark,
      letterSpacing: 0.5,
    },
    quickSelectSection: {
      marginBottom: moderateScale(20),
    },
    quickSelectLabel: {
      fontSize: moderateScale(14.5),
      fontWeight: '600',
      color: COLORS.darkGrey,
      marginBottom: moderateScale(10),
    },
    quickSelectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: moderateScale(8),
    },
    quickAmountButton: {
      backgroundColor: theme.colors.bgWhiteLight,
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
      borderRadius: moderateScale(24),
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    quickAmountButtonActive: {
      backgroundColor: theme.colors.primary + '15',
      borderColor: theme.colors.primary,
    },
    quickAmountText: {
      fontSize: moderateScale(13.5),
      fontWeight: '500',
      color: COLORS.mediumGrey,
      textAlign: 'center',
    },
    quickAmountTextActive: {
      color: theme.colors.textDark,
      fontWeight: '700',
    },
    footer: {
      paddingHorizontal: moderateScale(20),
      paddingVertical: moderateScale(16),
      borderTopWidth: 1,
      borderTopColor: COLORS.lightGrey,
      backgroundColor: COLORS.white,
    },
    submitButton: {
      borderRadius: moderateScale(14),
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    submitButtonDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
    submitGradient: {
      paddingVertical: moderateScale(15),
      paddingHorizontal: moderateScale(24),
      alignItems: 'center',
    },
    submitButtonText: {
      fontSize: moderateScale(16),
      fontWeight: '700',
      color: COLORS.white,
    },
  });
}

var styles = getStyles(theme);

export default function QuickJoinScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const router = useRouter();
  const { t } = useTranslation();
  const { user, storePaymentSession } = useGlobalStore();
  const [loading, setLoading] = useState(true);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({ name: user?.name || '', amount: '' });
  const [errors, setErrors] = useState({ name: '', amount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemeAmountLimits, setSchemeAmountLimits] = useState<any>(null);
  const [goldRate, setGoldRate] = useState<number>(0);
  const { language } = useGlobalStore();

  const getSchemeName = (scheme: any) => {
    if (!scheme?.SCHEMENAME) return t('scheme');
    if (typeof scheme.SCHEMENAME === 'string') return scheme.SCHEMENAME;
    return scheme.SCHEMENAME[language] || scheme.SCHEMENAME['en'] || t('scheme');
  };

  // Fetch Logic
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch schemes
      const schemesData = await fetchSchemesWithCache();
      if (schemesData && schemesData.length > 0) {
        setSchemes(schemesData);
        // Default select the first scheme so limits and form are immediately ready
        const firstScheme = schemesData[0];
        setSelectedScheme(firstScheme);
        fetchSchemeLimits(firstScheme.SCHEMEID);
      } else {
        Alert.alert(t('error'), t('schemes.noSchemesAvailable'), [
          { text: 'OK', onPress: () => router.back() }
        ]);
        setLoading(false);
        return;
      }

      // Fetch Gold Rate
      const homeResponse = await api.get(ENDPOINTS.HOME, { params: { userId: user?.id } });
      if (homeResponse.data?.data?.currentRates?.gold_rate) {
        setGoldRate(Number(homeResponse.data.data.currentRates.gold_rate.replace(/,/g, '')));
      }

      // Fetch Branches
      const branchesData = await fetchBranchesWithCache();
      if (branchesData && branchesData.length > 0) {
        setBranches(branchesData);
      }
    } catch (error) {
      logger.error('Error loading Quick Join data:', error);
      Alert.alert(t('error'), t('failedToLoadData'), [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchemeLimits = async (schemeId: number) => {
    try {
      const response = await api.get(`${ENDPOINTS.SCHEME_AMOUNT_LIMIT}/${schemeId}`);
      if (response.data && response.data.data) {
        setSchemeAmountLimits(response.data.data);
      } else {
        setSchemeAmountLimits(null);
      }
    } catch (error) {
      logger.warn('Failed to fetch scheme amount limits:', error);
      setSchemeAmountLimits(null);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', amount: '' };

    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired') || 'Name is required';
      isValid = false;
    }

    if (!formData.amount.trim()) {
      newErrors.amount = t('amountRequired') || 'Amount is required';
      isValid = false;
    } else {
      const amountNum = Number(formData.amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        newErrors.amount = t('validAmountRequired') || 'Enter a valid amount';
        isValid = false;
      } else if (schemeAmountLimits) {
        if (schemeAmountLimits.min_amount && amountNum < schemeAmountLimits.min_amount) {
          newErrors.amount = `${t('minAmountIs') || 'Minimum amount is'} ₹${schemeAmountLimits.min_amount}`;
          isValid = false;
        } else if (schemeAmountLimits.max_amount && amountNum > schemeAmountLimits.max_amount) {
          newErrors.amount = `${t('maxAmountIs') || 'Maximum amount is'} ₹${schemeAmountLimits.max_amount}`;
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!selectedScheme) {
      Alert.alert(t('error'), t('selectSchemeToContinue') || "Please select a scheme");
      return;
    }

    try {
      setIsSubmitting(true);

      // Pre-check for chits
      let activeChit = null;
      if (selectedScheme.chits && selectedScheme.chits.length > 0) {
        activeChit = selectedScheme.chits[0];
      } else {
        // Fallback fetch scheme detail
        try {
          const res = await api.get(`/schemes/${selectedScheme.SCHEMEID}`);
          const fetched = res.data?.data || res.data;
          if (fetched?.chits && fetched.chits.length > 0) {
            activeChit = fetched.chits[0];
          }
        } catch (e) {
          logger.warn("Could not fetch scheme chits:", e);
        }
      }

      if (!activeChit || activeChit.CHITID == null) {
        activeChit = {
          CHITID: 0,
          PAYMENT_FREQUENCY_ID: 1,
          PAYMENT_FREQUENCY: 'monthly'
        };
      }

      // 1. Create Investment (Enroll)
      const enrollPayload = {
        userId: user?.id,
        schemeId: Number(selectedScheme.SCHEMEID),
        chitId: activeChit.CHITID,
        accountName: formData.name.trim(),
        associated_branch: user?.branch_id || (branches.length > 0 ? branches[0].id : "1"),
        payment_frequency_id: activeChit.PAYMENT_FREQUENCY_ID || 1,
      };

      const enrollRes = await api.post(ENDPOINTS.INVESTMENTS, enrollPayload);
      const enrollData = enrollRes.data;

      // Extract account details
      const accountNo = enrollData?.data?.accountNo || enrollData?.data?.data?.accountNo || enrollData?.accountNo;
      const investmentId = enrollData?.data?.id || enrollData?.data?.data?.id || enrollData?.id;

      if (!accountNo || !investmentId) {
        throw new Error(enrollData?.message || "Failed to create scheme account");
      }

      // Store payment session
      const paymentSessionData: any = {
        amount: Number(formData.amount.replace(/,/g, "")),
        userDetails: {
          userId: user?.id,
          accountname: formData.name.trim(),
          name: formData.name.trim(),
          mobile: user?.mobile,
          email: user?.email,
          accountNo: accountNo,
          accNo: accountNo,
          investmentId: investmentId,
          schemeId: selectedScheme.SCHEMEID,
          chitId: activeChit.CHITID,
          branchId: enrollPayload.associated_branch,
          paymentFrequency: activeChit.PAYMENT_FREQUENCY || 'monthly',
          schemeType: selectedScheme.SCHEMETYPE || 'monthly',
          isRetryAttempt: false,
          source: "quick_join",
        },
        timestamp: new Date().toISOString(),
      };
      storePaymentSession(paymentSessionData);

      // Navigate
      router.push({
        pathname: "/(app)/(tabs)/home/paymentNewOverView",
        params: {
          amount: formData.amount.replace(/,/g, ""),
          schemeName: getSchemeName(selectedScheme) || 'Scheme',
          schemeId: String(selectedScheme.SCHEMEID),
          chitId: String(activeChit.CHITID),
          schemeType: selectedScheme.SCHEMETYPE || 'monthly',
          savinsTypes: selectedScheme.savingType || (selectedScheme.SCHEMETYPE?.toLowerCase() === "weight" ? "weight" : "amount"),
          userDetails: JSON.stringify(paymentSessionData.userDetails),
        },
      });

    } catch (error: any) {
      logger.error("Quick Join Error", error);
      Alert.alert(t('error'), error.message || t('failedToInitiateJoin') || "Failed to initiate join");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
      <View style={styles.modalContainer}>
        {/* Grab Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="flash" size={22} color="#850111" />
            </View>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t("quickJoin") || "Quick Join"}</Text>
              <Text style={styles.subtitle}>{t("joinThisSchemeStartSaving") || "Join scheme and start saving"}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <View style={styles.closeButtonContainer}>
              <Ionicons name="close" size={20} color={COLORS.dark} />
            </View>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Beautified Scheme Selector */}
            {schemes.length > 0 && (
              <View style={styles.schemeSelectorContainer}>
                <View style={styles.schemeSelectorHeader}>
                  <Text style={styles.schemeSelectorLabel}>
                    {schemes.length > 1
                      ? (t("selectScheme") || "Select Scheme")
                      : (t("selectedScheme") || "Selected Scheme")}
                  </Text>
                  <Text style={styles.schemeCountBadge}>
                    {schemes.length}{" "}
                    {schemes.length === 1
                      ? (typeof t("scheme") === "string" ? t("scheme") : "Scheme")
                      : (typeof t("schemes.title") === "string" ? t("schemes.title") : "Schemes")}
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.schemePillScroll}
                  contentContainerStyle={styles.schemeCardsContainer}
                >
                  {schemes.map((scheme, index) => {
                    const isActive = selectedScheme?.SCHEMEID === scheme.SCHEMEID;
                    const metal = getSchemeMetalType(scheme);
                    const coinIcon = getSchemeDisplayImage(scheme, metal);
                    const typeLabel = getSchemeTypeLabel(scheme);
                    const slabs = getSchemeInterestSlabs(scheme);
                    const isBonus = slabs.length > 0;
                    const schemeName = getSchemeName(scheme);
                    const duration = scheme.DURATION_MONTHS || scheme.DURATION || "11";
                    const themeColors = getSchemeCardTheme(metal, isActive);

                    return (
                      <TouchableOpacity
                        key={scheme.SCHEMEID || index}
                        activeOpacity={0.88}
                        onPress={() => {
                          safeHaptic(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedScheme(scheme);
                          fetchSchemeLimits(scheme.SCHEMEID);
                        }}
                        style={styles.schemeCardTouch}
                      >
                        <LinearGradient
                          colors={themeColors.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[
                            styles.schemeCard,
                            { borderColor: themeColors.borderColor },
                            isActive && styles.schemeCardActiveGlow,
                          ]}
                        >
                          {/* Top Row: Metal Badge + Bonus Badge + Radio Selection */}
                          <View style={styles.schemeCardTopRow}>
                            <View
                              style={[
                                styles.schemeMetalBadge,
                                {
                                  backgroundColor: themeColors.badgeBg,
                                  borderColor: themeColors.badgeBorder,
                                },
                              ]}
                            >
                              <Ionicons
                                name={
                                  metal === "silver"
                                    ? "disc-outline"
                                    : metal === "diamond"
                                    ? "diamond-outline"
                                    : "sparkles"
                                }
                                size={11}
                                color={themeColors.badgeText}
                              />
                              <Text
                                style={[
                                  styles.schemeMetalBadgeText,
                                  { color: themeColors.badgeText },
                                ]}
                              >
                                {metal.toUpperCase().replace("_", " ")}
                              </Text>
                            </View>

                            {isBonus && (
                              <View style={[styles.schemeBonusBadge, isActive && styles.schemeBonusBadgeActive]}>
                                <Ionicons name="gift" size={10} color={isActive ? "#FFD700" : "#D97706"} />
                                <Text style={[styles.schemeBonusBadgeText, isActive && styles.schemeBonusBadgeTextActive]}>
                                  BONUS
                                </Text>
                              </View>
                            )}

                            <View style={styles.schemeRadioCircle}>
                              <Ionicons
                                name={isActive ? "checkmark-circle" : "ellipse-outline"}
                                size={19}
                                color={themeColors.radioColor}
                              />
                            </View>
                          </View>

                          {/* Middle Row: 3D Metal Icon & Scheme Name */}
                          <View style={styles.schemeCardMiddleRow}>
                            <View
                              style={[
                                styles.schemeIconWrapper,
                                { backgroundColor: themeColors.iconGlow },
                              ]}
                            >
                              <Image
                                source={coinIcon}
                                style={styles.schemeCoinImage}
                                resizeMode="contain"
                              />
                            </View>
                            <View style={styles.schemeNameWrapper}>
                              <Text
                                style={[
                                  styles.schemeCardName,
                                  { color: themeColors.titleColor },
                                ]}
                                numberOfLines={2}
                              >
                                {schemeName}
                              </Text>
                            </View>
                          </View>

                          {/* Bottom Row: Micro Badges (Duration & Type) */}
                          <View style={styles.schemeCardBottomRow}>
                            <View
                              style={[
                                styles.schemeInfoPill,
                                { backgroundColor: themeColors.pillBg },
                              ]}
                            >
                              <Ionicons
                                name="calendar-outline"
                                size={11}
                                color={themeColors.pillText}
                              />
                              <Text
                                style={[
                                  styles.schemeInfoPillText,
                                  { color: themeColors.pillText },
                                ]}
                              >
                                {duration} {t("schemes.months") || "Months"}
                              </Text>
                            </View>

                            <View
                              style={[
                                styles.schemeInfoPill,
                                { backgroundColor: themeColors.pillBg },
                              ]}
                            >
                              <Ionicons
                                name={
                                  typeLabel.toLowerCase() === "flexi"
                                    ? "options-outline"
                                    : "timer-outline"
                                }
                                size={11}
                                color={themeColors.pillText}
                              />
                              <Text
                                style={[
                                  styles.schemeInfoPillText,
                                  { color: themeColors.pillText },
                                ]}
                              >
                                {typeLabel}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {selectedScheme && (
              <>
                {/* Name Input */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>{t("name") || "Full Name"}</Text>
                  <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color={COLORS.mediumGrey} />
                    <TextInput
                      style={styles.textInput}
                      value={formData.name}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                      placeholder={t("enterName")}
                      placeholderTextColor={COLORS.mediumGrey}
                    />
                  </View>
                  {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                </View>

                {/* Amount Input */}
                <View style={styles.inputSection}>
                  <View style={styles.amountHeader}>
                    <Text style={styles.inputLabel}>{t("amount") || "Investment Amount"}</Text>
                    {schemeAmountLimits && (
                      <Text style={styles.limitText}>
                        {t('min')} ₹{schemeAmountLimits.min_amount} - {t('max')} ₹{schemeAmountLimits.max_amount}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.inputContainer, errors.amount && styles.inputError]}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <TextInput
                      style={styles.textInput}
                      value={formData.amount}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/[^0-9]/g, '');

                        // Check if exceeding max amount
                        if (schemeAmountLimits && schemeAmountLimits.max_amount) {
                          if (Number(cleaned) > schemeAmountLimits.max_amount) {
                            return;
                          }
                        }

                        setFormData(prev => ({ ...prev, amount: cleaned }));
                        if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                      }}
                      placeholder={t("enterAmount")}
                      placeholderTextColor={COLORS.mediumGrey}
                      keyboardType="numeric"
                    />
                  </View>
                  {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
                </View>
              </>
            )}

            {/* Gold Weight */}
            {selectedScheme?.savingType === 'weight' && goldRate > 0 && (
              <LinearGradient
                colors={['#FFF9E6', '#FFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goldWeightCard}
              >
                <View style={styles.goldWeightHeader}>
                  <View style={styles.goldIconBg}>
                    <Ionicons name="scale" size={18} color="#B8860B" />
                  </View>
                  <Text style={styles.goldWeightLabel}>
                    {t("estimatedGoldWeight") || "Est. Gold Weight"}
                  </Text>
                </View>
                <Text style={styles.goldWeightValue}>
                  {formatGoldWeight(Number(formData.amount) / goldRate)}
                </Text>
              </LinearGradient>
            )}

            {/* Quick Select */}
            {(schemeAmountLimits?.quickselectedamount?.length ?? 0) > 0 && (
              <View style={styles.quickSelectSection}>
                <Text style={styles.quickSelectLabel}>{t("quickSelect") || "Quick Select"}</Text>
                <View style={styles.quickSelectGrid}>
                  {schemeAmountLimits.quickselectedamount
                    .filter((amt: number) => amt >= (schemeAmountLimits.min_amount || 0) && amt <= (schemeAmountLimits.max_amount || Infinity))
                    .map((amount: number, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.quickAmountButton,
                          formData.amount === String(amount) && styles.quickAmountButtonActive
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, amount: String(amount) }))}
                      >
                        <Text style={[
                          styles.quickAmountText,
                          formData.amount === String(amount) && styles.quickAmountTextActive
                        ]}>₹{amount.toLocaleString('en-IN')}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          {selectedScheme ? (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={isSubmitting ? [COLORS.mediumGrey, COLORS.mediumGrey] : [theme.colors.secondary, theme.colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitButtonText}>{t("joinNow") || "Join Now"}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <Text style={{ textAlign: 'center', color: COLORS.mediumGrey }}>{t("selectSchemeToContinue") || "Select a scheme to continue"}</Text>
          )}
        </View>
      </View>
    </View>
  );
}


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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/hooks/useTranslation';
import useGlobalStore from '@/store/global.store';
import { theme } from '@/constants/theme';
import { COLORS } from '@/constants/colors';
import api from '@/services/api'; 
const ENDPOINTS = {
    HOME: '/home',
    SCHEME_AMOUNT_LIMIT: '/amount-limits/scheme',
    BRANCHES: '/branches',
    INVESTMENTS: '/investments'
};
import { fetchSchemesWithCache } from '@/utils/apiCache';
import { formatGoldWeight } from '@/utils/imageUtils';
import { logger } from '@/utils/logger';

// Reuse styles from home/index.tsx (styles2)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: COLORS.white,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.text.mediumGrey,
    marginTop: 4,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 16,
  },
  closeButtonContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.darkGrey,
    marginLeft: 12,
    paddingVertical: 8,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.mediumGrey,
    marginLeft: 8,
  },
  goldWeightCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  goldWeightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goldIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  goldWeightLabel: {
    fontSize: 14,
    color: COLORS.mediumGrey,
    marginLeft: 8,
  },
  goldWeightValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text.dark,
    letterSpacing: 0.5,
  },
  quickSelectSection: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  quickSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: theme.colors.bgWhiteLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quickAmountButtonActive: {
    backgroundColor: theme.colors.primary + '15',
    borderColor: theme.colors.primary,
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.mediumGrey,
    textAlign: 'center',
  },
  quickAmountTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGrey,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    borderRadius: 12,
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
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  schemeSelectorContainer: {
    marginBottom: 20,
  },
  schemeSelectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGrey,
    marginBottom: 12,
  },
  schemePillScroll: {
    flexGrow: 0,
  },
  schemePill: {
    width: 110,
    height: 90,
    padding: 8,
    backgroundColor: theme.colors.bgWhiteLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  schemePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  schemePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.mediumGrey,
    textAlign: 'center',
  },
  schemePillTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default function QuickJoinScreen() {
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
        if (schemesData.length === 1) {
             const firstScheme = schemesData[0];
             setSelectedScheme(firstScheme);
             fetchSchemeLimits(firstScheme.SCHEMEID);
        } else {
             // For multiple schemes, let user select.
             // Do not fetch limits yet.
             setSelectedScheme(null); 
        }
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
       
       // Fetch Branches for investment creation (if not in store)
       fetchBranches();

    } catch (error) {
      console.error("Error loading quick join data:", error);
      Alert.alert(t('error'), "Failed to load data");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
      try {
          const res = await api.get(ENDPOINTS.BRANCHES);
          if (res.data?.data) {
              setBranches(res.data.data);
          }
      } catch (e) {
          logger.error("Error fetching branches", e);
      }
  };

  const fetchSchemeLimits = async (schemeId: string | number) => {
    try {
        const response = await api.get(`${ENDPOINTS.SCHEME_AMOUNT_LIMIT}/${schemeId}`);
        if (response.data?.data) {
             const limitData = response.data.data;
             // Find active limit Logic from home/index.tsx
             const activeLimit = Array.isArray(limitData)
               ? limitData.find((limit: any) => limit.is_active === 1)
               : (limitData.is_active === 1 ? limitData : null);

            if (activeLimit) {
                setSchemeAmountLimits({
                    min_amount: parseFloat(activeLimit.min_amount) || 0,
                    max_amount: parseFloat(activeLimit.max_amount) || 0,
                    quickselectedamount: activeLimit.quickselectedamount || [],
                });
            }
        }
    } catch (error) {
        console.error("Error fetching limits:", error);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const validate = () => {
    let newErrors = { name: '', amount: '' };
    let isValid = true;

    if (!formData.name.trim()) {
        newErrors.name = t('enterName') || 'Name is required';
        isValid = false;
    }

    if (!formData.amount) {
        newErrors.amount = t('enterAmount') || 'Amount is required';
        isValid = false;
    } else {
        const amt = Number(formData.amount.replace(/,/g, ''));
        if (isNaN(amt) || amt <= 0) {
            newErrors.amount = t('enterValidAmount') || 'Invalid amount';
            isValid = false;
        } else if (schemeAmountLimits) {
            if (amt < schemeAmountLimits.min_amount) {
                newErrors.amount = `${t('min') || 'Min'} ₹${schemeAmountLimits.min_amount}`;
                isValid = false;
            } else if (amt > schemeAmountLimits.max_amount) {
                newErrors.amount = `${t('max') || 'Max'} ₹${schemeAmountLimits.max_amount}`;
                isValid = false;
            }
        }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate() || !selectedScheme) return;
    if (!user) {
        Alert.alert(t('error') || "Error", t('pleaseLoginToContinue') || "Please login to continue");
        return;
    }
    
    setIsSubmitting(true);
    try {
        // Get Active Chit
        const activeChit = selectedScheme.chits?.find((chit: any) => chit.ACTIVE === "Y");
        if (!activeChit) {
            Alert.alert(t('error') || "Error", t('noActivePaymentPlan') || "No active payment plan found");
            return;
        }

        // Branch ID
        let branchId = branches.length > 0 ? String(branches[0].id) : null;
        if (!branchId) {
             // Try to use a dummy if strict validation not enforced locally
             // But usually required
             // We can check if user has associated branch?
             // Using '1' as fallback or error?
             // Alert.alert("Error", "Branch not loaded");
             // return;
             // Let's assume branch fetching works or user has default.
        }

        const payload = {
            userId: user.id || "",
            schemeId: Number(selectedScheme.SCHEMEID),
            chitId: activeChit.CHITID || null,
            accountName: formData.name.trim(),
            associated_branch: branchId || '1', // Fallback
            payment_frequency_id: activeChit.PAYMENT_FREQUENCY_ID || null,
        };

        const response = await api.post(ENDPOINTS.INVESTMENTS, payload);
        const data = response.data?.data?.data || response.data?.data || response.data;
        const accountNo = data?.accountNo || data?.account_no;
        const investmentId = data?.id || data?.investment_id;

        if (!accountNo || !investmentId) {
             throw new Error(t('failedToCreateInvestment') || "Failed to create investment (No Account No)");
        }

        // Store Payment Session
        const paymentSessionData = {
            amount: Number(formData.amount.replace(/,/g, "")),
            userDetails: {
                ...payload,
                name: formData.name, // ensure name is top level
                accountname: formData.name.trim(),
                mobile: String(user.mobile || ""),
                email: user.email || "",
                investmentId: investmentId,
                accNo: accountNo,
                schemeName: selectedScheme.SCHEMENAME,
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
              schemeName: selectedScheme.SCHEMENAME || 'Scheme',
              schemeId: String(selectedScheme.SCHEMEID),
              chitId: String(activeChit.CHITID),
              schemeType: selectedScheme.SCHEMETYPE || 'monthly',
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
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
  }

  // if (!selectedScheme) return null; // Removed check to allow selection UI

  return (
    <View style={styles.container}>
       <TouchableOpacity style={{flex: 1}} activeOpacity={1} onPress={handleClose} />
       <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>{t("quickJoin") || "Quick Join"}</Text>
              <Text style={styles.subtitle}>{t("joinThisSchemeStartSaving") || "Join scheme and start saving"}</Text>
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
             {/* Scheme Selector */}
             {schemes.length > 1 && (
                 <View style={styles.schemeSelectorContainer}>
                     <Text style={styles.schemeSelectorLabel}>{t("selectScheme") || "Select Scheme"}</Text>
                     <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        style={styles.schemePillScroll}
                        contentContainerStyle={{ paddingRight: 20 }}
                     >
                         {schemes.map((scheme, index) => {
                             const isActive = selectedScheme?.SCHEMEID === scheme.SCHEMEID;
                             return (
                                 <TouchableOpacity
                                    key={scheme.SCHEMEID || index}
                                    style={[styles.schemePill, isActive && styles.schemePillActive]}
                                    onPress={() => {
                                        setSelectedScheme(scheme);
                                        fetchSchemeLimits(scheme.SCHEMEID);
                                    }}
                                 >
                                    <Text style={[styles.schemePillText, isActive && styles.schemePillTextActive]}>
                                        {getSchemeName(scheme)}
                                    </Text>
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
                   onChangeText={(text) => setFormData(prev => ({...prev, name: text}))}
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
                                  // Optionally show a toast or just ignore
                                  return; 
                              }
                          }

                          setFormData(prev => ({...prev, amount: cleaned}));
                          if(errors.amount) setErrors(prev => ({...prev, amount: ''}));
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
                               onPress={() => setFormData(prev => ({...prev, amount: String(amount)}))}
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


             <View style={{height: 100}} />
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
                <Text style={{textAlign: 'center', color: COLORS.mediumGrey}}>{t("selectSchemeToContinue") || "Select a scheme to continue"}</Text>
             )}
           </View>
       </View>
    </View>
  );
}

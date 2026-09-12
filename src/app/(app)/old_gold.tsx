import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  StatusBar,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { shadowUtils } from "@/utils/shadowUtils";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import api, { ticketsAPI } from "@/services/api";
import { theme } from "@/constants/theme";
import DynamicSchemeCard from "@/components/DynamicSchemeCard";

const { wp, hp, rf } = responsiveUtils;
const { width } = Dimensions.get("window");

const PRIMARY = "#7A0019";
const DARK = "#4A0010";
const GOLD = "#D4AF37";
const CARD_BG = "#3B1F14";
const GRAY_TEXT = "#CCCCCC";

type ActiveTab = "deposits" | "enquiry" | "schemes";

interface Deposit {
  id: number;
  investmentId: number;
  schemeName: string;
  schemeType: string;
  grossWeight: number;
  purityCarat: number;
  purityPercentage: number;
  netGoldWeight: number;
  depositDate: string;
  maturityDate: string;
  status: string;
  daysToMaturity: number;
  ornamentDescription: string;
  ornamentPhotos: string[];
  goldRateAtDeposit: number;
  valuationAmount: number;
}

const getSafeString = (textObj: any): string => {
  if (!textObj) return "";
  if (typeof textObj === "string") return textObj;
  if (typeof textObj === "object") {
    return textObj.en || textObj.ta || Object.values(textObj)[0] || "";
  }
  return String(textObj);
};

export default function OldGoldScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t, locale } = useTranslation();
  const { user } = useGlobalStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>("deposits");
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submittingEnquiry, setSubmittingEnquiry] = useState<boolean>(false);
  const [oldGoldSchemes, setOldGoldSchemes] = useState<any[]>([]);
  const [expandedSchemeId, setExpandedSchemeId] = useState<number | null>(null);

  useEffect(() => {
    if (params.tab === "schemes") {
      setActiveTab("schemes");
    }
    if (params.schemeId) {
      setExpandedSchemeId(Number(params.schemeId));
    }
  }, [params.tab, params.schemeId]);

  useEffect(() => {
    const fetchOldGoldSchemes = async () => {
      try {
        const { fetchSchemesWithCache } = await import("@/utils/apiCache");
        const schemesData = await fetchSchemesWithCache();
        if (schemesData && Array.isArray(schemesData)) {
          const filtered = schemesData.filter((scheme: any) => {
            const schemeNameLower = getSafeString(scheme.SCHEMENAME).toLowerCase();
            const insTypeLower = getSafeString(scheme.INS_TYPE).toLowerCase();
            const schemeTypeLower = getSafeString(scheme.SCHEMETYPE).toLowerCase();
            const isOldGold =
              insTypeLower.includes("old gold") ||
              scheme.scheme_plan_type_id === 4 ||
              scheme.SCHEME_PLAN_TYPE_ID === 4 ||
              schemeTypeLower.includes("old gold") ||
              schemeNameLower.includes("old gold");
            return isOldGold;
          });
          setOldGoldSchemes(filtered);
        }
      } catch (error) {
        console.error("Error fetching old gold schemes:", error);
      }
    };
    fetchOldGoldSchemes();
  }, []);

  const getTranslatedText = (textObj: any, lang: string = "en"): string => {
    if (!textObj) return "";
    if (typeof textObj === "string") return textObj;
    if (typeof textObj === "object") {
      // @ts-ignore
      return textObj[lang] || textObj["en"] || Object.values(textObj)[0] || "";
    }
    return String(textObj);
  };

  // Enquiry form state
  const [estWeight, setEstWeight] = useState("");
  const [purity, setPurity] = useState("22K");
  const [description, setDescription] = useState("");
  const [comments, setComments] = useState("");

  const fetchDeposits = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const response = await api.get(`/old-gold/user/${user.id}`, { skipLoading: true } as any);
      if (response.data && response.data.success) {
        setDeposits(response.data.data || []);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        console.log("ℹ️ Old gold deposits endpoint not found (404), skipping.");
      } else {
        console.error("Error fetching old gold deposits:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleSubmitEnquiry = async () => {
    if (!estWeight) {
      Alert.alert(
        t("error") || "Error",
        t("pleaseEnterEstWeight") || "Please enter estimated weight."
      );
      return;
    }

    setSubmittingEnquiry(true);
    try {
      const payload = {
        userId: user?.id,
        name: user?.name || "Customer",
        phone: user?.mobile?.toString() || "",
        email: user?.email || "",
        subject: "Old Gold Inquiry",
        message: `Old Gold Chit Scheme Enquiry:
- Estimated Weight: ${estWeight} g
- Purity: ${purity}
- Description: ${description || "None"}
- Additional Comments: ${comments || "None"}`,
        referenceType: "OLD_GOLD",
      };

      const response = await ticketsAPI.createTicket(payload);
      if (response.data?.success) {
        Alert.alert(
          t("success") || "Success",
          t("enquirySubmitSuccess") || "Your enquiry has been submitted successfully. Our team will contact you shortly."
        );
        setEstWeight("");
        setDescription("");
        setComments("");
        setActiveTab("deposits");
      } else {
        Alert.alert(
          t("error") || "Error",
          t("enquirySubmitError") || "Failed to submit enquiry. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error submitting old gold enquiry:", error);
      Alert.alert(
        t("error") || "Error",
        t("enquirySubmitGenericError") || "An error occurred while submitting your enquiry."
      );
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.quaternary }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
        </TouchableOpacity>
        <ResponsiveText color={theme.colors.textDark} size="lg" weight="bold" style={styles.headerTitle}>
          {t("oldGoldScheme") || "Old Gold Scheme"}
        </ResponsiveText>
        <View style={{ width: 40 }} />
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === "deposits" && styles.tabActive]}
        onPress={() => setActiveTab("deposits")}
      >
        <ResponsiveText
          color={activeTab === "deposits" ? GOLD : "#888"}
          weight={activeTab === "deposits" ? "bold" : "normal"}
          size="sm"
        >
          {t("myDeposits") || "My Deposits"}
        </ResponsiveText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === "enquiry" && styles.tabActive]}
        onPress={() => setActiveTab("enquiry")}
      >
        <ResponsiveText
          color={activeTab === "enquiry" ? GOLD : "#888"}
          weight={activeTab === "enquiry" ? "bold" : "normal"}
          size="sm"
        >
          {t("newEnquiry") || "New Enquiry"}
        </ResponsiveText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabBtn, activeTab === "schemes" && styles.tabActive]}
        onPress={() => setActiveTab("schemes")}
      >
        <ResponsiveText
          color={activeTab === "schemes" ? GOLD : "#888"}
          weight={activeTab === "schemes" ? "bold" : "normal"}
          size="sm"
        >
          {t("schemeDetails") || "Scheme Details"}
        </ResponsiveText>
      </TouchableOpacity>
    </View>
  );

  const renderDeposits = () => {
    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      );
    }

    if (deposits.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="gold" size={64} color="#888" />
          <ResponsiveText color="#FFF" size="md" style={{ marginTop: 12, textAlign: "center" }}>
            {t("noOldGoldDeposits") || "You have no old gold deposits."}
          </ResponsiveText>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setActiveTab("enquiry")}
          >
            <ResponsiveText color={DARK} weight="bold">
              {t("fillEnquiryForm") || "Fill Enquiry Form"}
            </ResponsiveText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {deposits.map((dep) => (
          <View key={dep.id} style={styles.depositCard}>
            <View style={styles.cardHeader}>
              <View>
                <ResponsiveText color="#FFF" size="md" weight="bold">
                  {dep.schemeName || "Old Gold Scheme"}
                </ResponsiveText>
                <ResponsiveText color={GRAY_TEXT} size="xs">
                  Investment ID: {dep.investmentId || "N/A"}
                </ResponsiveText>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      dep.status === "active" ? "rgba(8, 237, 8, 0.2)" : "rgba(255, 0, 0, 0.2)",
                  },
                ]}
              >
                <ResponsiveText
                  color={dep.status === "active" ? "#4CAF50" : "#F44336"}
                  size="xs"
                  weight="bold"
                >
                  {dep.status?.toUpperCase()}
                </ResponsiveText>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("grossWeight") || "Gross Weight"}
                  </ResponsiveText>
                  <ResponsiveText color="#FFF" size="sm" weight="bold">
                    {dep.grossWeight} g
                  </ResponsiveText>
                </View>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("purityCarat") || "Purity Carat"}
                  </ResponsiveText>
                  <ResponsiveText color="#FFF" size="sm" weight="bold">
                    {dep.purityCarat}K ({dep.purityPercentage}%)
                  </ResponsiveText>
                </View>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("netWeight") || "Net Weight"}
                  </ResponsiveText>
                  <ResponsiveText color={GOLD} size="sm" weight="bold">
                    {dep.netGoldWeight} g
                  </ResponsiveText>
                </View>
              </View>

              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("depositDate") || "Deposit Date"}
                  </ResponsiveText>
                  <ResponsiveText color="#FFF" size="sm">
                    {new Date(dep.depositDate).toLocaleDateString("en-IN")}
                  </ResponsiveText>
                </View>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("maturityDate") || "Maturity Date"}
                  </ResponsiveText>
                  <ResponsiveText color="#FFF" size="sm">
                    {new Date(dep.maturityDate).toLocaleDateString("en-IN")}
                  </ResponsiveText>
                </View>
                <View style={styles.infoCol}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("remainingDays") || "Remaining Days"}
                  </ResponsiveText>
                  <ResponsiveText color={GOLD} size="sm" weight="bold">
                    {dep.daysToMaturity} {t("daysLabel") || "Days"}
                  </ResponsiveText>
                </View>
              </View>

              {dep.ornamentDescription && (
                <View style={{ marginTop: 12 }}>
                  <ResponsiveText color={GRAY_TEXT} size="xs">
                    {t("descriptionLabel") || "Description"}
                  </ResponsiveText>
                  <ResponsiveText color="#FFF" size="sm">
                    {dep.ornamentDescription}
                  </ResponsiveText>
                </View>
              )}

              {dep.ornamentPhotos && dep.ornamentPhotos.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  {/* Images Slider */}
                  {(() => {
                    const images = dep.ornamentPhotos.filter(p => !p.toLowerCase().endsWith('.pdf'));
                    if (images.length === 0) return null;
                    return (
                      <View style={{ marginBottom: 12 }}>
                        <ResponsiveText color={GRAY_TEXT} size="xs" style={{ marginBottom: 6 }}>
                          {t("photos") || "Photos"}
                        </ResponsiveText>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {images.map((photo, idx) => {
                            const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/$/, '') : (theme?.baseUrl || 'https://api.prod.kanisaajewellery.com');
                            const cleanPhoto = photo.startsWith('/') ? photo : `/${photo}`;
                            const fullUrl = photo.startsWith('http') ? photo : `${baseURL}${cleanPhoto}`;
                            return (
                              <Image
                                key={idx}
                                source={{ uri: fullUrl }}
                                style={styles.ornamentImage}
                                resizeMode="cover"
                              />
                            );
                          })}
                        </ScrollView>
                      </View>
                    );
                  })()}

                  {/* Documents List */}
                  {(() => {
                    const docs = dep.ornamentPhotos.filter(p => p.toLowerCase().endsWith('.pdf'));
                    if (docs.length === 0) return null;
                    return (
                      <View>
                        <ResponsiveText color={GRAY_TEXT} size="xs" style={{ marginBottom: 4 }}>
                          {t("documents") || "Documents & Receipts"}
                        </ResponsiveText>
                        {docs.map((doc, idx) => {
                          const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/$/, '') : (theme?.baseUrl || 'https://api.prod.kanisaajewellery.com');
                          const cleanDoc = doc.startsWith('/') ? doc : `/${doc}`;
                          const fullUrl = doc.startsWith('http') ? doc : `${baseURL}${cleanDoc}`;
                          const fileName = doc.split('/').pop()?.split('-').slice(1).join('-') || doc.split('/').pop() || 'document.pdf';
                          return (
                            <TouchableOpacity
                              key={idx}
                              style={styles.documentRow}
                              onPress={() => Linking.openURL(fullUrl).catch(err => console.error("Error opening URL:", err))}
                            >
                              <Ionicons name="document-text" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
                              <ResponsiveText color={GOLD} size="xs" weight="bold" style={{ flex: 1 }} numberOfLines={1}>
                                {fileName}
                              </ResponsiveText>
                              <Ionicons name="download-outline" size={16} color={GOLD} />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    );
                  })()}
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderEnquiryForm = () => (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.formContainer}>
          <ResponsiveText color="#FFF" size="md" weight="bold" style={{ marginBottom: 16 }}>
            {t("oldGoldEnquiryForm") || "Old Gold Scheme Enquiry Form"}
          </ResponsiveText>

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("nameLabel") || "Name"}
          </ResponsiveText>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.name || ""}
            editable={false}
          />

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("mobileNumberLabel") || "Mobile Number"}
          </ResponsiveText>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user?.mobile?.toString() || ""}
            editable={false}
          />

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("estimatedGoldWeight") || "Estimated Gold Weight (grams) *"}
          </ResponsiveText>
          <TextInput
            style={styles.input}
            placeholder={t("eg10") || "e.g. 10"}
            placeholderTextColor="#666"
            value={estWeight}
            onChangeText={setEstWeight}
            keyboardType="numeric"
          />

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("purityCarats") || "Purity (Carats)"}
          </ResponsiveText>
          <View style={styles.purityRow}>
            {["18K", "22K", "24K"].map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.purityBtn, purity === c && styles.purityBtnActive]}
                onPress={() => setPurity(c)}
              >
                <ResponsiveText color={purity === c ? DARK : "#FFF"} weight="bold">
                  {c}
                </ResponsiveText>
              </TouchableOpacity>
            ))}
          </View>

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("ornamentDescription") || "Ornament Description"}
          </ResponsiveText>
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder={t("ornamentPlaceholder") || "e.g. Bangles, Chains..."}
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <ResponsiveText color={GRAY_TEXT} size="xs" style={styles.label}>
            {t("additionalComments") || "Additional Comments"}
          </ResponsiveText>
          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder={t("commentsPlaceholder") || "If you have any queries, ask here..."}
            placeholderTextColor="#666"
            value={comments}
            onChangeText={setComments}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, submittingEnquiry && styles.disabledButton]}
            onPress={handleSubmitEnquiry}
            disabled={submittingEnquiry}
          >
            {submittingEnquiry ? (
              <ActivityIndicator color={DARK} />
            ) : (
              <ResponsiveText color={DARK} weight="bold">
                {t("submitEnquiry") || "Submit Enquiry"}
              </ResponsiveText>
            )}
          </TouchableOpacity>

          {/* Contact Showroom Card */}
          <View style={styles.contactCard}>
            <ResponsiveText color={GOLD} size="sm" weight="bold" style={{ marginBottom: 8 }}>
              {t("needImmediateAssistance") || "Need Immediate Assistance?"}
            </ResponsiveText>
            <ResponsiveText color={GRAY_TEXT} size="xs" style={{ marginBottom: 12, lineHeight: 16 }}>
              {t("oldGoldContactDesc") || "For urgent inquiries regarding the Old Gold Scheme, please feel free to call or WhatsApp our showroom directly."}
            </ResponsiveText>
            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`tel:${theme.constants.mobile}`)}
              >
                <Ionicons name="call" size={16} color={DARK} />
                <ResponsiveText color={DARK} size="xs" weight="bold" style={{ marginLeft: 6 }}>
                  {t("callUs") || "Call Us"}
                </ResponsiveText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: "#25D366" }]}
                onPress={() => Linking.openURL(`https://wa.me/${theme.constants.whatsapp.replace('+', '')}`)}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                <ResponsiveText color="#FFF" size="xs" weight="bold" style={{ marginLeft: 6 }}>
                  {t("whatsappUs") || "WhatsApp"}
                </ResponsiveText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderSchemes = () => {
    if (oldGoldSchemes.length === 0) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={GOLD} />
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <DynamicSchemeCard
          horizontal={false}
          schemes={oldGoldSchemes}
          initialSchemeId={expandedSchemeId || undefined}
          onEnquirePress={(scheme) => {
            setDescription(`Inquiry about ${getTranslatedText(scheme.SCHEMENAME, 'en')}`);
            setActiveTab("enquiry");
          }}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
      {renderHeader()}
      {renderTabs()}
      <View style={{ flex: 1 }}>
        {activeTab === "deposits" && renderDeposits()}
        {activeTab === "enquiry" && renderEnquiryForm()}
        {activeTab === "schemes" && renderSchemes()}
      </View>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.quaternary,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 12 : 20,
      paddingBottom: 16,
      paddingHorizontal: wp(4),
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
    },
    tabsContainer: {
      flexDirection: "row",
      backgroundColor: CARD_BG,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(212, 175, 55, 0.2)",
    },
    tabBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 6,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: GOLD,
    },
    scrollContent: {
      padding: wp(4),
    },
    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: wp(10),
    },
    actionBtn: {
      backgroundColor: GOLD,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 20,
    },
    depositCard: {
      backgroundColor: CARD_BG,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
      ...shadowUtils.SHADOW_PRESETS.small,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    divider: {
      height: 1,
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      marginVertical: 12,
    },
    cardBody: {},
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    infoCol: {
      flex: 1,
    },
    ornamentImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 10,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
    },
    documentRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
      borderRadius: 8,
      padding: 10,
      marginTop: 6,
    },
    formContainer: {
      backgroundColor: CARD_BG,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
    },
    label: {
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 12 : 8,
      color: "#FFF",
      fontSize: 14,
    },
    disabledInput: {
      backgroundColor: "rgba(255, 255, 255, 0.02)",
      borderColor: "rgba(255, 255, 255, 0.05)",
      color: "#888",
    },
    purityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    purityBtn: {
      flex: 1,
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
      marginHorizontal: 4,
    },
    purityBtnActive: {
      backgroundColor: GOLD,
      borderColor: GOLD,
    },
    submitBtn: {
      backgroundColor: GOLD,
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
    },
    disabledButton: {
      opacity: 0.6,
    },
    schemeDetailCard: {
      backgroundColor: CARD_BG,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.2)",
    },
    benefitRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    benefitTextCol: {
      marginLeft: 12,
      flex: 1,
    },
    contactCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderWidth: 1,
      borderColor: "rgba(212, 175, 55, 0.1)",
      borderRadius: 8,
      padding: 12,
      marginTop: 20,
    },
    contactRow: {
      flexDirection: "row",
      gap: 12,
    },
    contactBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: GOLD,
      paddingVertical: 10,
      borderRadius: 6,
    },
  })
}

var styles = getStyles(theme);;

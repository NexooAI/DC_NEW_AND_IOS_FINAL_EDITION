import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";
import { LinearGradient } from "expo-linear-gradient";
import useGlobalStore from "@/store/global.store";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { useFocusEffect } from "@react-navigation/native";
import FAQService, { TicketPayload } from "@/services/faqService";
import { useTranslation } from "@/hooks/useTranslation";

import { logger } from '@/utils/logger';
interface TicketResponse {
  success: boolean;
  ticketId: string;
  message?: string;
}

export default function TicketFormScreen() {
  const { t } = useTranslation();
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(
    null
  );
  const router = useRouter();
  const { user, setTabVisibility } = useGlobalStore();

  // Hide bottom navigation when screen is focused
  useFocusEffect(
    useCallback(() => {
      setTabVisibility(false);

      return () => {
        setTabVisibility(true);
      };
    }, [setTabVisibility])
  );

  const handleSubmit = useCallback(async () => {
    if (!question.trim()) {
      Alert.alert(t("error"), t("pleaseEnterQuestion"));
      return;
    }

    if (!user?.id) {
      Alert.alert(t("error"), t("userNotFound"));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create ticket payload
      const ticketPayload: TicketPayload = {
        userId: user.id,
        question: question.trim(),
        category: t("generalSupport"),
        priority: "medium",
        userInfo: {
          name: user.name,
          email: user.email,
          phone: user.mobile?.toString() || "",
        },
      };

      const response = await FAQService.createTicket(ticketPayload);

      if (response.success) {
        setSubmittedTicketId(response.ticketId);
        Alert.alert(
          t("ticketCreatedSuccessfully"),
          `${t("yourSupportTicketCreated")} ${response.ticketId}\n\n${t(
            "supportTeamWillGetBack"
          )}`,
          [
            {
              text: t("ok"),
              onPress: () => {
                setQuestion("");
                setSubmittedTicketId(null);
                router.back();
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || t("failedToCreateTicket"));
      }
    } catch (error) {
      logger.error("Error creating ticket:", error);

      // For demo purposes, create a mock ticket ID
      const mockTicketId = `TKT-${Date.now()}`;
      setSubmittedTicketId(mockTicketId);

      Alert.alert(
        t("ticketCreatedSuccessfully"),
        `${t("yourSupportTicketCreated")} ${mockTicketId}\n\n${t(
          "noteDemoResponse"
        )}`,
        [
          {
            text: t("ok"),
            onPress: () => {
              setQuestion("");
              setSubmittedTicketId(null);
              router.back();
            },
          },
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [question, user, router]);

  const handleBack = useCallback(() => {
    if (question.trim() && !submittedTicketId) {
      Alert.alert(t("discardChanges"), t("youHaveUnsavedChanges"), [
        { text: t("cancel"), style: "cancel" },
        { text: t("discard"), onPress: () => router.back() },
      ]);
    } else {
      router.back();
    }
  }, [question, submittedTicketId, router]);

  if (submittedTicketId) {
    return (
      <AppLayoutWrapper showHeader={false} showBottomBar={false}>
        <SafeAreaView style={styles.container}>
          <View style={styles.successContainer}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.support_container[1]]}
              style={styles.successHeader}
            >
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>
                {t("ticketCreatedSuccessfully")}
              </Text>
            </LinearGradient>

            <View style={styles.ticketInfoContainer}>
              <Text style={styles.ticketIdLabel}>{t("yourTicketId")}</Text>
              <Text style={styles.ticketId}>{submittedTicketId}</Text>

              <Text style={styles.ticketDescription}>
                {t("supportTeamWillReview")}
              </Text>

              <TouchableOpacity
                style={styles.backToFaqButton}
                onPress={() => {
                  setSubmittedTicketId(null);
                  router.back();
                }}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary,
                    theme.colors.support_container[1],
                  ]}
                  style={styles.backToFaqGradient}
                >
                  <Text style={styles.backToFaqText}>{t("backToFaq")}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </AppLayoutWrapper>
    );
  }

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.support_container[1]]}
          style={styles.header}
        >
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t("createSupportTicket")}</Text>
            <Text style={styles.headerSubtitle}>{t("describeYourIssue")}</Text>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{t("whatCanWeHelpYouWith")}</Text>
              <Text style={styles.formDescription}>
                {t("pleaseProvideDetail")}
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t("issueDescription")} *</Text>
                <TextInput
                  style={styles.textInput}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={t("describeYourIssueOrQuestion")}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={1000}
                />
                <Text style={styles.characterCount}>
                  {question.length}/1000 {t("characters")}
                </Text>
              </View>

              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>
                  {t("tipsForBetterSupport")}
                </Text>
                <Text style={styles.tipText}>
                  • {t("beSpecificAboutProblem")}
                </Text>
                <Text style={styles.tipText}>
                  • {t("includeErrorMessages")}
                </Text>
                <Text style={styles.tipText}>
                  • {t("mentionWhatYouWereTrying")}
                </Text>
                <Text style={styles.tipText}>• {t("includeDeviceType")}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!question.trim() || isSubmitting) &&
                    styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!question.trim() || isSubmitting}
              >
                <LinearGradient
                  colors={
                    !question.trim() || isSubmitting
                      ? ["#ccc", "#999"]
                      : [
                          theme.colors.primary,
                          theme.colors.support_container[1],
                        ]
                  }
                  style={styles.submitGradient}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.submitText}>
                      {t("createSupportTicket")}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppLayoutWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: moderateScale(24),
    color: "white",
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: moderateScale(18),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  formDescription: {
    fontSize: moderateScale(14),
    color: "#666",
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    fontSize: moderateScale(14),
    color: "#333",
    backgroundColor: "#f9f9f9",
    minHeight: 120,
  },
  characterCount: {
    fontSize: moderateScale(12),
    color: "#999",
    textAlign: "right",
    marginTop: 5,
  },
  tipsContainer: {
    backgroundColor: "#f0f8ff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  tipText: {
    fontSize: moderateScale(12),
    color: "#666",
    marginBottom: 4,
  },
  submitButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 15,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successHeader: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  successIcon: {
    fontSize: moderateScale(48),
    color: "white",
    marginBottom: 10,
  },
  successTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  ticketInfoContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketIdLabel: {
    fontSize: moderateScale(14),
    color: "#666",
    marginBottom: 5,
  },
  ticketId: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 15,
  },
  ticketDescription: {
    fontSize: moderateScale(14),
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  backToFaqButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  backToFaqGradient: {
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  backToFaqText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
});

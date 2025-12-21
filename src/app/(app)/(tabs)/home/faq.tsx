import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  useWindowDimensions,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

// Types
interface FAQItem {
  id: number;
  question: string;
  answer: string;
  table?: Array<{ period: string; bonus: string }>;
}

interface FAQItemProps {
  item: FAQItem;
  isOpen: boolean;
  toggleOpen: () => void;
  translations: Record<string, string>;
  index: number;
}

interface Translations {
  [key: string]: string;
}

// Enhanced FAQ Item Component with animations
const FAQItem: React.FC<FAQItemProps> = ({
  item,
  isOpen,
  toggleOpen,
  translations,
  index,
}) => {
  const { t } = useTranslation();
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedHeight, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnimation, {
        toValue: isOpen ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnimation, {
        toValue: isOpen ? 1.02 : 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Animated.View
      style={[
        styles.faqItem,
        { transform: [{ scale: scaleAnimation }] },
        { marginTop: index === 0 ? 0 : 12 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.questionContainer,
          isOpen && styles.questionContainerOpen,
        ]}
        onPress={toggleOpen}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={
            isOpen
              ? [theme.colors.primary, theme.colors.support_container[1]]
              : ["#f8f9fa", "#ffffff"]
          }
          style={styles.gradientContainer}
        >
          <View style={styles.questionContent}>
            <Text
              style={[styles.questionText, isOpen && styles.questionTextOpen]}
            >
              {item.question}
            </Text>
            <Animated.View
              style={{ transform: [{ rotate: rotateInterpolate }] }}
            >
              <View
                style={[
                  styles.expandIconContainer,
                  isOpen && styles.expandIconContainerOpen,
                ]}
              >
                <Text
                  style={[styles.expandIcon, isOpen && styles.expandIconOpen]}
                >
                  ▼
                </Text>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.answerContainer,
          {
            maxHeight: animatedHeight.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animatedHeight,
          },
        ]}
      >
        <View style={styles.answerContent}>
          <Text style={styles.answerText}>{item.answer}</Text>

          {item.table && (
            <View style={styles.tableContainer}>
              <LinearGradient
                colors={["#5a000b", "#8b0000"]}
                style={styles.tableHeader}
              >
                <Text style={styles.tableHeaderText}>{translations.times}</Text>
                <Text style={styles.tableHeaderText}>
                  {translations.immideate_bonese}
                </Text>
              </LinearGradient>

              {item.table.map((row, tableIndex) => (
                <View
                  key={tableIndex}
                  style={[
                    styles.tableRow,
                    tableIndex % 2 === 0
                      ? styles.tableRowEven
                      : styles.tableRowOdd,
                  ]}
                >
                  <Text style={styles.tableCell}>{row.period}</Text>
                  <Text style={styles.tableCell}>{row.bonus}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};

export default function FAQScreen() {
  const { t } = useTranslation();
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  const { language, setTabVisibility } = useGlobalStore();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const translations: Translations = useMemo(
    () => ({
      defaultTitle: t("privacyPolicyTitle"),
      defaultContent: t("privacyPolicyContent"),
      defaultDiscription: t("privacyPolicyDiscription"),
      question1: t("question1"),
      answer1: t("answer1"),
      question2: t("question2"),
      answer2: t("answer2"),
      question3: t("question3"),
      answer3: t("answer3"),
      question4: t("question4"),
      answer4: t("answer4"),
      question5: t("question5"),
      answer5: t("answer5"),
      question6: t("question6"),
      answer6: t("answer6"),
      question7: t("question7"),
      answer7: t("answer7"),
      question8: t("question8"),
      answer8: t("answer8"),
      question9: t("question9"),
      answer9: t("answer9"),
      question10: t("question10"),
      answer10: t("answer10"),
      question11: t("question11"),
      answer11: t("answer11"),
      question12: t("question12"),
      answer12: t("answer12"),
      question13: t("question13"),
      answer13: t("answer13"),
      question14: t("question14"),
      answer14: t("answer14"),
      period1: t("period1"),
      bonus1: t("bonus1"),
      period2: t("period2"),
      bonus2: t("bonus2"),
      period3: t("period3"),
      bonus3: t("bonus3"),
      period4: t("period4"),
      bonus4: t("bonus4"),
      period5: t("period5"),
      bonus5: t("bonus5"),
      storeName: t("storeName"),
      faqQuestion: t("faqQuestion"),
      copyright: t("copyright"),
      times: t("times"),
      immideate_bonese: t("immideate_bonese"),
    }),
    [language]
  );

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: translations.question1,
      answer: translations.answer1,
    },
    {
      id: 2,
      question: translations.question2,
      answer: translations.answer2,
    },
    {
      id: 3,
      question: translations.question3,
      answer: translations.answer3,
    },
    {
      id: 4,
      question: translations.question4,
      answer: translations.answer4,
    },
    {
      id: 6,
      question: translations.question6,
      answer: translations.answer6,
    },
    {
      id: 7,
      question: translations.question7,
      answer: translations.answer7,
    },
    {
      id: 8,
      question: translations.question8,
      answer: translations.answer8,
    },
    {
      id: 9,
      question: translations.question9,
      answer: translations.answer9,
    },
    {
      id: 10,
      question: translations.question10,
      answer: translations.answer10,
    },
    {
      id: 11,
      question: translations.question11,
      answer: translations.answer11,
    },
    {
      id: 12,
      question: translations.question12,
      answer: translations.answer12,
    },
    {
      id: 13,
      question: translations.question13,
      answer: translations.answer13,
    },
    {
      id: 14,
      question: translations.question14,
      answer: translations.answer14,
    },
  ];

  const toggleItem = (id: number) => {
    setOpenItemId(openItemId === id ? null : id);
  };

  useFocusEffect(
    useCallback(() => {
      // Hide bottom navigation
      setTabVisibility(false);

      return () => {
        // Show bottom navigation when leaving the screen
        setTabVisibility(true);
      };
    }, [setTabVisibility])
  );

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <LinearGradient
          colors={["#f8f9fa", "#ffffff"]}
          style={styles.backgroundGradient}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
          >
            <View style={styles.headerContainer}>
              <LinearGradient
                colors={[
                  theme.colors.primary,
                  theme.colors.support_container[1],
                ]}
                style={styles.titleContainer}
              >
                <Text style={styles.mainTitle}>{translations.faqQuestion}</Text>
                <View style={styles.titleUnderline} />
              </LinearGradient>

              <Text style={styles.subtitle}>
                {t("findAnswersToCommonlyAsked")}
              </Text>
            </View>

            <View style={styles.faqContainer}>
              {faqData.map((item, index) => (
                <FAQItem
                  key={item.id}
                  item={item}
                  isOpen={openItemId === item.id}
                  toggleOpen={() => toggleItem(item.id)}
                  translations={translations}
                  index={index}
                />
              ))}
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>{t("stillHaveQuestions")}</Text>

              {/* FAQ Chat Button */}
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => router.push("/(app)/(tabs)/home/faq-chat")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[
                    theme.colors.primary,
                    theme.colors.support_container[1],
                  ]}
                  style={styles.chatButtonGradient}
                >
                  <Text style={styles.chatButtonText}>
                    💬 Chat with FAQ Bot
                  </Text>
                  <Text style={styles.chatButtonSubtext}>
                    Get instant answers to your questions
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    </AppLayoutWrapper>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  safeArea: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  titleContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  mainTitle: {
    fontSize: moderateScale(28),
    fontWeight: "800",
    color: "white",
    textAlign: "center",
    fontFamily: "serif",
    letterSpacing: 1,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "white",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: "#666",
    lineHeight: 24,
    textAlign: "center",
    letterSpacing: 0.4,
    maxWidth: width * 0.8,
  },
  faqContainer: {
    marginBottom: 20,
  },
  faqItem: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  questionContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  questionContainerOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  gradientContainer: {
    padding: 0,
  },
  questionContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  questionText: {
    fontSize: moderateScale(16),
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 16,
    lineHeight: 22,
  },
  questionTextOpen: {
    color: "white",
    fontWeight: "700",
  },
  expandIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  expandIconContainerOpen: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  expandIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  expandIconOpen: {
    color: "white",
  },
  answerContainer: {
    overflow: "hidden",
  },
  answerContent: {
    padding: 20,
    backgroundColor: "white",
  },
  answerText: {
    fontSize: moderateScale(14),
    color: "#666",
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  tableContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 16,
  },
  tableHeaderText: {
    flex: 1,
    paddingHorizontal: 16,
    color: "white",
    fontWeight: "700",
    textAlign: "center",
    fontSize: moderateScale(14),
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableRowEven: {
    backgroundColor: "#fafafa",
  },
  tableRowOdd: {
    backgroundColor: "white",
  },
  tableCell: {
    flex: 1,
    padding: 16,
    textAlign: "center",
    fontSize: moderateScale(14),
    color: "#333",
    fontWeight: "500",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 20,
  },
  footerText: {
    fontSize: moderateScale(14),
    color: "#888",
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 20,
  },
  chatButton: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatButtonGradient: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    alignItems: "center",
  },
  chatButtonText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  chatButtonSubtext: {
    fontSize: moderateScale(12),
    color: "rgba(255,255,255,0.8)",
  },
});

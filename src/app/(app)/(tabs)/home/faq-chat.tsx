import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";
import { LinearGradient } from "expo-linear-gradient";
import useGlobalStore from "@/store/global.store";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { useFocusEffect } from "@react-navigation/native";
import FAQService, { FAQQuestion } from "@/services/faqService";
import { useTranslation } from "@/hooks/useTranslation";

import { logger } from '@/utils/logger';
// Message interface
interface Message {
  id: string;
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
}

// FAQ Data - Dynamic loading from translation files
const getFAQQuestions = (t: (key: string) => string) => {
  const questions = [];

  // Load questions 1-14 from translation files
  for (let i = 1; i <= 14; i++) {
    const questionKey = `question${i}`;
    const answerKey = `answer${i}`;

    // Check if both question and answer exist in translations
    if (t(questionKey) !== questionKey && t(answerKey) !== answerKey) {
      questions.push({
        id: i.toString(),
        question: t(questionKey),
        answer: t(answerKey),
      });
    }
  }

  return questions;
};

export default function FAQChatScreen() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [faqQuestions, setFaqQuestions] = useState<FAQQuestion[]>([]);
  const [isLoadingFaq, setIsLoadingFaq] = useState(true);
  const router = useRouter();
  const { user, setTabVisibility } = useGlobalStore();
  const flatListRef = useRef<FlatList>(null);

  // Load FAQ questions from API
  useEffect(() => {
    const loadFAQQuestions = async () => {
      try {
        setIsLoadingFaq(true);
        const questions = await FAQService.getFAQQuestions();
        setFaqQuestions(questions);
      } catch (error) {
        logger.error("Error loading FAQ questions:", error);
        // Fallback to translation-based questions
        setFaqQuestions(getFAQQuestions(t));
      } finally {
        setIsLoadingFaq(false);
      }
    };

    loadFAQQuestions();
  }, [t]);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: "1",
      text: t("helloFaqBot"),
      createdAt: new Date(),
      user: {
        _id: "bot",
        name: t("faqBot"),
        avatar: "https://via.placeholder.com/40/007AFF/FFFFFF?text=B",
      },
    };
    setMessages([welcomeMessage]);
  }, [t]);

  // Hide bottom navigation when screen is focused
  useFocusEffect(
    useCallback(() => {
      setTabVisibility(false);

      return () => {
        setTabVisibility(true);
      };
    }, [setTabVisibility, t])
  );

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup any pending timeouts or intervals
      setIsTyping(false);
    };
  }, []);

  const onSend = useCallback(() => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text: inputText.trim(),
      createdAt: new Date(),
      user: {
        _id: user?.id || "user",
        name: user?.name || "User",
        avatar:
          user?.profileImage ||
          "https://via.placeholder.com/40/34C759/FFFFFF?text=U",
      },
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");

    // Check if the message matches any FAQ question
    const matchedFAQ = faqQuestions.find((faq) => {
      const userInput = inputText.toLowerCase().trim();
      const questionText = faq.question.toLowerCase().trim();

      // Direct match
      if (
        questionText.includes(userInput) ||
        userInput.includes(questionText)
      ) {
        return true;
      }

      // Check for keyword matches (split by spaces and check for common words)
      const userWords = userInput
        .split(/\s+/)
        .filter((word) => word.length > 2);
      const questionWords = questionText
        .split(/\s+/)
        .filter((word) => word.length > 2);

      // If at least 2 words match, consider it a match
      const matchingWords = userWords.filter((word) =>
        questionWords.some(
          (qWord) => qWord.includes(word) || word.includes(qWord)
        )
      );

      return matchingWords.length >= 2;
    });

    if (matchedFAQ) {
      // Simulate bot typing
      setIsTyping(true);

      setTimeout(() => {
        const botMessage: Message = {
          id: Math.random().toString(36).substr(2, 9),
          text: matchedFAQ.answer,
          createdAt: new Date(),
          user: {
            _id: "bot",
            name: t("faqBot"),
            avatar: "https://via.placeholder.com/40/007AFF/FFFFFF?text=B",
          },
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
      }, 1000);
    }
  }, [inputText, user, faqQuestions]);

  const handleFAQPress = useCallback(
    (faq: { id: string; question: string; answer: string }) => {
      // Add user message
      const userMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: faq.question,
        createdAt: new Date(),
        user: {
          _id: user?.id || "user",
          name: user?.name || "User",
          avatar:
            user?.profileImage ||
            "https://via.placeholder.com/40/34C759/FFFFFF?text=U",
        },
      };

      // Add bot response
      const botMessage: Message = {
        id: Math.random().toString(36).substr(2, 9),
        text: faq.answer,
        createdAt: new Date(),
        user: {
          _id: "bot",
          name: t("faqBot"),
          avatar: "https://via.placeholder.com/40/007AFF/FFFFFF?text=B",
        },
      };

      setMessages((prev) => [...prev, userMessage, botMessage]);
    },
    [user, t]
  );

  const handleNeedMoreHelp = useCallback(() => {
    Alert.alert(t("needMoreHelpTitle"), t("wouldLikeToCreateTicket"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("createTicket"),
        onPress: () => router.push("/(app)/(tabs)/home/ticket-form"),
      },
    ]);
  }, [router]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isBot = item.user._id === "bot";
    return (
      <View
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}
      >
        <View
          style={[styles.avatar, isBot ? styles.botAvatar : styles.userAvatar]}
        >
          <Text style={styles.avatarText}>{item.user.name?.[0] || "U"}</Text>
        </View>
        <View
          style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}
        >
          <Text
            style={[
              styles.bubbleText,
              isBot ? styles.botBubbleText : styles.userBubbleText,
            ]}
          >
            {item.text}
          </Text>
          <Text style={styles.messageTime}>
            {item.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderFAQButtons = () => {
    if (!faqQuestions || faqQuestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.faqContainer}>
        <Text style={styles.faqTitle}>{t("quickQuestions")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.faqButtonsContainer}
        >
          {faqQuestions.map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqButton}
              onPress={() => handleFAQPress(faq)}
            >
              <LinearGradient
                colors={[
                  theme.colors.primary,
                  theme.colors.support_container[1],
                ]}
                style={styles.faqButtonGradient}
              >
                <Text style={styles.faqButtonText} numberOfLines={2}>
                  {faq.question}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderNeedHelpButton = () => (
    <View style={styles.needHelpContainer}>
      <TouchableOpacity
        style={styles.needHelpButton}
        onPress={handleNeedMoreHelp}
      >
        <View style={[styles.needHelpGradient, { backgroundColor: "#FF6B6B" }]}>
          <Text style={styles.needHelpText}>{t("needMoreHelp")}</Text>
          <Text style={styles.needHelpSubtext}>{t("createSupportTicket")}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <AppLayoutWrapper showHeader={false} showBottomBar={false}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.support_container[1]]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>{t("faqAndSupport")}</Text>
          <Text style={styles.headerSubtitle}>{t("getInstantAnswers")}</Text>
        </LinearGradient>

        {/* Chat Messages */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }}
            onLayout={() => {
              if (flatListRef.current) {
                flatListRef.current.scrollToEnd({ animated: true });
              }
            }}
            removeClippedSubviews={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
          />

          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>{t("faqBotTyping")}</Text>
            </View>
          )}
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputArea}
        >
          {!isLoadingFaq && renderFAQButtons()}

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t("typeYourQuestionHere")}
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !inputText.trim() && styles.sendButtonDisabled,
              ]}
              onPress={onSend}
              disabled={!inputText.trim()}
            >
              <View
                style={[
                  styles.sendButtonGradient,
                  {
                    backgroundColor: !inputText.trim()
                      ? "#ccc"
                      : theme.colors.primary,
                  },
                ]}
              >
                <Text style={styles.sendButtonText}>{t("send")}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {renderNeedHelpButton()}
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginTop: 5,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 10,
  },
  botMessageContainer: {
    justifyContent: "flex-start",
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  botAvatar: {
    backgroundColor: "#007AFF",
  },
  userAvatar: {
    backgroundColor: theme.colors.primary,
  },
  avatarText: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "bold",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  botBubble: {
    backgroundColor: "#e0e0e0",
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: moderateScale(14),
    lineHeight: 20,
  },
  botBubbleText: {
    color: "#333",
  },
  userBubbleText: {
    color: "white",
  },
  messageTime: {
    fontSize: moderateScale(10),
    color: "#666",
    marginTop: 4,
    textAlign: "right",
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  typingText: {
    fontSize: moderateScale(12),
    color: "#666",
    fontStyle: "italic",
  },
  inputArea: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  faqContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  faqTitle: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  faqButtonsContainer: {
    paddingHorizontal: 5,
  },
  faqButton: {
    marginRight: 10,
    borderRadius: 20,
    overflow: "hidden",
    minWidth: 120,
    maxWidth: 200,
  },
  faqButtonGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  faqButtonText: {
    color: "white",
    fontSize: moderateScale(12),
    fontWeight: "600",
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: moderateScale(14),
    color: "#333",
    backgroundColor: "#f9f9f9",
    maxHeight: 100,
  },
  sendButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: "white",
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  needHelpContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  needHelpButton: {
    borderRadius: 25,
    overflow: "hidden",
  },
  needHelpGradient: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  needHelpText: {
    color: "white",
    fontSize: moderateScale(16),
    fontWeight: "bold",
  },
  needHelpSubtext: {
    color: "rgba(255,255,255,0.8)",
    fontSize: moderateScale(12),
    marginTop: 2,
  },
});

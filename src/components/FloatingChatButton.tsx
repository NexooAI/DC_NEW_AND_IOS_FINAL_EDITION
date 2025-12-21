import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const FloatingChatButton = () => {
  const { t } = useTranslation();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useGlobalStore();
  const flatListRef = useRef<FlatList>(null);

  // FAQ Data
  const FAQ_QUESTIONS = [
    {
      id: "1",
      question: "How to reset my password?",
      answer:
        "To reset your password, go to the Profile tab, tap on 'Change Password', enter your current password, then set your new password. Make sure to use a strong password with at least 8 characters.",
    },
    {
      id: "2",
      question: "How to update my profile?",
      answer:
        "You can update your profile by going to the Profile tab and tapping on 'Edit Profile'. You can change your name, email, phone number, and profile picture.",
    },
    {
      id: "3",
      question: "How to check my savings balance?",
      answer:
        "Your savings balance is displayed on the home screen. You can also go to the Savings tab to see detailed information about your savings schemes and transactions.",
    },
    {
      id: "4",
      question: "How to make a payment?",
      answer:
        "To make a payment, go to the home screen and tap on 'Make Payment'. Select your payment method, enter the amount, and follow the on-screen instructions.",
    },
    {
      id: "5",
      question: "How to contact customer support?",
      answer:
        "You can contact our customer support by calling +91 9061803999 or emailing dcjewellerstcr@gmail.com. Our support team is available 24/7 to help you.",
    },
    {
      id: "6",
      question: "How to track my transactions?",
      answer:
        "You can track your transactions by going to the Savings tab and selecting 'Transaction History'. All your recent transactions will be displayed there.",
    },
  ];

  const sendMessage = () => {
    if (inputText.trim() === "") return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate bot response
    setIsTyping(true);
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message! Our support team will get back to you shortly. In the meantime, you can check our FAQ section for quick answers to common questions.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const sendFAQResponse = (question: string, answer: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: answer,
      isUser: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, botMessage]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.botBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              item.isUser ? styles.userText : styles.botText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingChatButton}
        onPress={() => setIsChatVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.support_container[1]]}
          style={styles.floatingButtonGradient}
        >
          <Ionicons name="chatbubble" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isChatVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsChatVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.chatModalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Header */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.support_container[1]]}
            style={styles.chatHeader}
          >
            <View style={styles.chatHeaderContent}>
              <Text style={styles.chatHeaderTitle}>Live Chat Support</Text>
              <Text style={styles.chatHeaderSubtitle}>Get instant help</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsChatVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Messages */}
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            />

            {/* Typing Indicator */}
            {isTyping && (
              <View style={styles.typingContainer}>
                <Text style={styles.typingText}>Support is typing...</Text>
              </View>
            )}

            {/* FAQ Section */}
            <View style={styles.faqSection}>
              <Text style={styles.faqTitle}>Quick Help</Text>
              {FAQ_QUESTIONS.map((faq) => (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqItem}
                  onPress={() => sendFAQResponse(faq.question, faq.answer)}
                >
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type your message..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={inputText.trim() === ""}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={
                    inputText.trim() === "" ? "#ccc" : theme.colors.primary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingChatButton: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001, // Higher than home button
  },
  floatingButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  chatModalContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  chatHeaderContent: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "white",
  },
  chatHeaderSubtitle: {
    fontSize: moderateScale(14),
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  closeButton: {
    padding: 5,
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
  },
  userMessage: {
    justifyContent: "flex-end",
  },
  botMessage: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: 20,
  },
  userText: {
    color: "white",
  },
  botText: {
    color: "#333",
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
  faqSection: {
    backgroundColor: "white",
    margin: 10,
    borderRadius: 10,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  faqTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  faqItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  faqQuestion: {
    fontSize: moderateScale(14),
    color: theme.colors.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: moderateScale(14),
    color: "#333",
  },
  sendButton: {
    padding: 10,
  },
});

export default FloatingChatButton;

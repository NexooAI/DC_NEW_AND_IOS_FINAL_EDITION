import React, { useState, useRef, useEffect } from "react";
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
  Linking,
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";
import { useTranslation } from "@/hooks/useTranslation";
import useGlobalStore from "@/store/global.store";
import { ticketsAPI } from "@/services/api";

const { width, height } = Dimensions.get("window");

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const TICKET_SUBJECTS = [
  "Scheme Inquiry",
  "Payment Issue",
  "KYC & Account Support",
  "Branch Inquiry",
  "Bill Payment",
  "Advance Gold Inquiry",
  "Others"
];

const FloatingChatButton = () => {
  const { t } = useTranslation();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  
  // Custom Modals State
  const [isTicketModalVisible, setIsTicketModalVisible] = useState(false);
  const [isSubjectPickerVisible, setIsSubjectPickerVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("Scheme Inquiry");
  const [ticketDescription, setTicketDescription] = useState("");
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Animations
  const scaleValue = useRef(new Animated.Value(1)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const modalSlide = useRef(new Animated.Value(height)).current;

  // Support Number (from FAQ)
  const SUPPORT_NUMBER = "919061803999"; 

  // FAQ Data (Updated for Jewelry & Schemes)
  const FAQ_QUESTIONS = [
    {
      id: "1",
      question: "How do I join a gold scheme?",
      answer:
        "Go to the 'Our Schemes' section from the home page, select a scheme you like, and tap on 'Join Now'. You can choose your branch and initial payment amount.",
    },
    {
      id: "2",
      question: "What is Advance Booking?",
      answer:
        "Advance Booking allows you to fix the gold rate for a future purchase. You pay a small percentage (5%, 10%, etc.) as an advance, and we secure the current rate for up to 120 days.",
    },
    {
      id: "3",
      question: "How can I pay my bill online?",
      answer:
        "Go to 'Bill Payments' from the dashboard. You will see your 'New Bills' list. Tap 'Pay Now' on any bill to proceed with payment.",
    },
    {
      id: "4",
      question: "How are reward points calculated?",
      answer:
        "You earn reward points for every successful referral who joins a scheme through your link or code. Check 'Reward History' for a detailed breakdown.",
    },
    {
      id: "5",
      question: "Is my payment secure?",
      answer:
        "Yes, we use industry-standard encryption and verified payment gateways (like Razorpay) to ensure all your transactions are safe and secure.",
    },
  ];

  // Dynamic filter for FAQs
  const filteredFaqs = FAQ_QUESTIONS.filter((faq) =>
    faq.question.toLowerCase().includes(inputText.toLowerCase())
  );

  useEffect(() => {
    // Pulse animation for the floating button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const { isChatOpen, setChatOpen, user } = useGlobalStore();

  useEffect(() => {
    if (isChatOpen) {
      setIsChatVisible(true);
      Animated.spring(modalSlide, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      setIsChatVisible(false);
      modalSlide.setValue(height);
    }
  }, [isChatOpen]);

  const closeChat = () => {
    setChatOpen(false);
    setIsChatVisible(false);
  };

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const openWhatsApp = async (initialText: string = "") => {
    const url = `whatsapp://send?phone=${SUPPORT_NUMBER}&text=${encodeURIComponent(
      initialText
    )}`;
    
    try {
      // Attempt to open directly to bypass Android 11+ query visibility restrictions
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert("Error", "WhatsApp is not installed on this device");
      console.error("WhatsApp Open Error:", err);
    }
  };

  const handleCreateTicket = async () => {
    if (ticketDescription.trim() === "") {
      Alert.alert(t("error") || "Error", "Please enter a description/message.");
      return;
    }

    try {
      setIsSubmittingTicket(true);
      const payload = {
        name: user?.name || user?.firstName || "Customer",
        phone: user?.mobile?.toString() || "",
        email: user?.email || "",
        subject: selectedSubject,
        message: ticketDescription,
      };

      const response = await ticketsAPI.createTicket(payload);
      setIsSubmittingTicket(false);

      if (response.data?.success) {
        Alert.alert(
          "Success",
          `Ticket created successfully! Reference: ${response.data.data?.ticket_no || response.data.data?.id || ''}`
        );
        setIsTicketModalVisible(false);
        setInputText(""); // Clear parent input
        setTicketDescription(""); // Clear modal input
        
        // Add ticket confirmation message in chat list
        const botMsg: Message = {
          id: Date.now().toString(),
          text: `🎫 Support Ticket Created!\nSubject: ${selectedSubject}\nReference No: ${response.data.data?.ticket_no || response.data.data?.id || ''}\nOur support representative will respond shortly.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to create ticket");
      }
    } catch (err: any) {
      setIsSubmittingTicket(false);
      console.error("Error creating ticket:", err);
      Alert.alert("Error", err.response?.data?.message || err.message || "Network error. Please try again.");
    }
  };

  const sendMessage = () => {
    if (inputText.trim() === "") return;
    
    // Instead of WhatsApp, we trigger ticket generation modal pre-filled
    setTicketDescription(inputText.trim());
    setSelectedSubject("Scheme Inquiry"); // default subject
    setIsTicketModalVisible(true);
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
    
    // Scroll to bottom
    setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
        {/* Timestamp could go here */}
      </View>
    );
  };

  return (
    <>
      {/* Floating Button Hidden as requested */}
      
      {/* Chat Modal */}
      <Modal
        visible={isChatVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
            <Animated.View 
                style={[
                    styles.chatModalContainer,
                    { transform: [{ translateY: modalSlide }] }
                ]}
            >
                    {/* Header */}
                    <View style={styles.chatHeader}> 
                    {/* Replaced Gradient with solid view for testing or use simple style if Gradient problematic */}
                        <View style={styles.headerTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={styles.avatarContainer}>
                                    <Image 
                                        source={require("../../assets/images/logo.png")} 
                                        style={styles.avatarImage} 
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={styles.chatHeaderTitle}>Support Assistant</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={styles.onlineDot} />
                                        <Text style={styles.chatHeaderSubtitle}>Online</Text>
                                    </View>
                                </View>
                            </View>
                            
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={closeChat}
                            >
                                <Ionicons name="close-circle" size={32} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>                    {/* Messages Area */}
                    <View style={styles.chatBody}>
                         {/* Default Welcome Message if empty */}
                          {messages.length === 0 && (
                            <View style={styles.welcomeContainer}>
                                <Text style={styles.welcomeText}>
                                    👋 Hi there! How can we help you today?
                                </Text>
                                <Text style={styles.welcomeSubtext}>
                                    Select a topic below or type your question to create a support ticket.
                                </Text>
                            </View>
                        )}
                        
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            renderItem={renderMessage}
                            keyExtractor={(item) => item.id}
                            style={styles.messagesList}
                            contentContainerStyle={styles.messagesContent}
                            showsVerticalScrollIndicator={false}
                        />
                        
                        {/* FAQ Chips (Compact, Horizontal Scroll) */}
                        <View style={styles.faqContainer}>
                            <Text style={styles.sectionHeader}>Common Questions</Text>
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.faqHorizontalScroll}
                            >
                                {filteredFaqs.map((faq) => (
                                    <TouchableOpacity
                                        key={faq.id}
                                        style={styles.faqChipHorizontal}
                                        onPress={() => sendFAQResponse(faq.question, faq.answer)}
                                    >
                                        <Text style={styles.faqTextHorizontal} numberOfLines={2}>{faq.question}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Input Area */}
                    <View style={styles.inputWrapper}>
                        <View style={styles.inputContainer}>
                            <TouchableOpacity
                                style={styles.leftMenuButton}
                                onPress={() => {
                                    setTicketDescription(inputText);
                                    setIsSubjectPickerVisible(true);
                                }}
                            >
                                <Ionicons
                                    name="list-outline"
                                    size={24}
                                    color={theme.colors.primary}
                                />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Type a message..."
                                placeholderTextColor="#999"
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.sendButton,
                                    { backgroundColor: inputText.trim() ? theme.colors.primary : '#e0e0e0' }
                                ]}
                                onPress={sendMessage}
                                disabled={inputText.trim() === ""}
                            >
                                <Ionicons
                                    name="create-outline"
                                    size={20}
                                    color={inputText.trim() ? "white" : "#999"}
                                />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.whatsappHint}>
                            Select topics or type a message to generate a support ticket
                        </Text>
                    </View>
            </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Subject Picker Modal */}
      <Modal
        visible={isSubjectPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsSubjectPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setIsSubjectPickerVisible(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Inquiry Subject</Text>
              <TouchableOpacity onPress={() => setIsSubjectPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {TICKET_SUBJECTS.map((sub) => (
                <TouchableOpacity
                  key={sub}
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedSubject(sub);
                    setIsSubjectPickerVisible(false);
                    setIsTicketModalVisible(true);
                  }}
                >
                  <Text style={styles.pickerItemText}>{sub}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Create Ticket Modal */}
      <Modal
        visible={isTicketModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsTicketModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.ticketOverlay}
        >
          <View style={styles.ticketContainer}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketTitle}>Create Support Ticket</Text>
              <TouchableOpacity onPress={() => setIsTicketModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.ticketContent} keyboardShouldPersistTaps="handled">
              {/* Name Field (Read-only) */}
              <Text style={styles.label}>Name</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>
                  {user?.name || user?.firstName || "Customer"}
                </Text>
              </View>

              {/* Phone Field (Read-only) */}
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyText}>
                  {user?.mobile || "N/A"}
                </Text>
              </View>

              {/* Subject Field (Clickable to change) */}
              <Text style={styles.label}>Inquiry Subject</Text>
              <TouchableOpacity
                style={styles.subjectSelector}
                onPress={() => {
                  setIsTicketModalVisible(false);
                  setIsSubjectPickerVisible(true);
                }}
              >
                <Text style={styles.subjectText}>{selectedSubject}</Text>
                <Ionicons name="arrow-down-circle" size={20} color={theme.colors.primary} />
              </TouchableOpacity>

              {/* Description Field */}
              <Text style={styles.label}>Description / Message</Text>
              <TextInput
                style={styles.ticketDescriptionInput}
                value={ticketDescription}
                onChangeText={setTicketDescription}
                placeholder="Describe your issue or inquiry..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                maxLength={1000}
              />

              {/* Action Buttons */}
              {isSubmittingTicket ? (
                <View style={styles.ticketLoading}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
              ) : (
                <View style={styles.ticketActions}>
                  <TouchableOpacity
                    style={[styles.btnCancel, { borderWidth: 1, borderColor: '#ccc' }]}
                    onPress={() => setIsTicketModalVisible(false)}
                  >
                    <Text style={[styles.btnCancelText, { color: '#666' }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btnSubmit, { backgroundColor: theme.colors.primary }]}
                    onPress={handleCreateTicket}
                    disabled={ticketDescription.trim() === ""}
                  >
                    <Text style={styles.btnSubmitText}>Generate Ticket</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 100 : 90,
    right: 24,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  fabPulseRing: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    opacity: 0.3,
  },
  floatingChatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  floatingButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  chatModalContainer: {
    height: "85%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 20,
  },
  chatHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: theme.colors.primary, // Force background color
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  chatHeaderTitle: {
    fontSize: moderateScale(18),
    fontWeight: "800",
    color: "white",
    letterSpacing: 0.5,
  },
  chatHeaderSubtitle: {
    fontSize: moderateScale(12),
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'white',
  },
  closeButton: {
    opacity: 0.9,
  },
  
  // Chat Body
  chatBody: {
    flex: 1,
    backgroundColor: "#F5F7F9",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginVertical: 30,
    paddingHorizontal: 30,
  },
  welcomeText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: moderateScale(13),
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Messages
  messageContainer: {
    flexDirection: "row",
    marginVertical: 6,
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
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  botBubble: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f0f0f0',
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
  
  // FAQ Section
  faqContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sectionHeader: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  faqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  faqText: {
    fontSize: moderateScale(13),
    color: '#444',
    flex: 1,
    fontWeight: '500',
  },
  
  // Input Area
  inputWrapper: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: '#F5F7F9',
    borderRadius: 24,
    padding: 4,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: moderateScale(14),
    color: "#333",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  whatsappHint: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 6,
  },
  leftMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  faqHorizontalScroll: {
    paddingRight: 16,
  },
  faqChipHorizontal: {
    width: 160,
    height: 70,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
    justifyContent: 'center',
  },
  faqTextHorizontal: {
    fontSize: moderateScale(12),
    color: '#444',
    fontWeight: '500',
    lineHeight: 16,
  },
  // Custom Subject Picker Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
    padding: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  pickerList: {
    marginBottom: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  // Ticket Modal Styles
  ticketOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  ticketContent: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    marginTop: 12,
  },
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  subjectSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  subjectText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  ticketDescriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    maxHeight: 180,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  ticketLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  ticketActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  btnCancel: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnSubmit: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSubmitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default FloatingChatButton;

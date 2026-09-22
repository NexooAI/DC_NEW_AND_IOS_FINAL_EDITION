import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppTheme } from "@/store/global.store";

export const RedeemFaqSectionV2: React.FC = () => {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const steps = [
    {
      icon: "options-outline",
      title: t("chooseHowToRedeem") || "Choose How to Redeem",
      desc:
        t("chooseHowToRedeemDesc") ||
        "Select whether you want to use your points for jewelry purchase or scheme installment discount.",
    },
    {
      icon: "storefront-outline",
      title: t("visitStoreRedeem") || "Visit the Store",
      desc:
        t("visitStoreRedeemDesc") ||
        "Visit our store with your registered mobile number while making your purchase.",
    },
    {
      icon: "checkmark-done-circle-outline",
      title: t("instantDeduction") || "Instant Deduction",
      desc:
        t("instantDeductionDesc") ||
        "1 Point = ₹1 discount directly applied to your invoice total upon checkout.",
    },
  ];

  const faqs = [
    {
      q: t("refer_earn_faq_limit_q") || "Is there a limit on how many friends I can refer?",
      a: t("refer_earn_faq_limit_a") || "No! You can refer as many friends as you want and earn points for every friend who joins and makes their first payment.",
    },
    {
      q: t("refer_earn_faq_credited_q") || "When will my referral points be credited?",
      a: t("refer_earn_faq_credited_a") || "Points are credited immediately to your rewards wallet as soon as your friend completes their first scheme installment or payment.",
    },
    {
      q: t("refer_earn_faq_wallet_q") || "How much is 1 reward point worth?",
      a: t("refer_earn_faq_wallet_a") || "1 Reward Point is strictly equal to ₹1. 500 points = ₹500 discount on your jewelry purchase.",
    },
    {
      q: t("refer_earn_faq_receive_q") || "Can I convert points to cash directly?",
      a: t("refer_earn_faq_receive_a") || "Reward points can be redeemed towards gold/silver jewelry purchases or scheme installments at our showroom.",
    },
    {
      q: t("refer_earn_faq_share_q") || "How do I share my referral code?",
      a: t("refer_earn_faq_share_a") || "You can tap the 'Invite Friends on WhatsApp' button below or copy your unique referral code and share via SMS or social apps.",
    },
    {
      q: t("refer_earn_faq_amount_q") || "What is the minimum points required to redeem?",
      a: t("refer_earn_faq_amount_a") || "You can redeem points starting from 100 points during your purchase at our store.",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Steps to Redeem Card */}
      <View style={styles.stepsCard}>
        <View style={styles.stepsHeader}>
          <FontAwesome5 name="gift" size={17} color="#D4AF37" style={{ marginRight: 8 }} />
          <Text style={styles.stepsHeaderTitle}>
            {t("stepsToRedeem") || "Steps to Redeem Points"}
          </Text>
        </View>

        <View style={styles.stepsList}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepIconBox}>
                <Ionicons name={step.icon as any} size={22} color="#850111" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  {index + 1}. {step.title}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* FAQs Section */}
      <View style={styles.faqSection}>
        <View style={styles.faqHeaderRow}>
          <Ionicons name="help-circle-outline" size={20} color="#D4AF37" style={{ marginRight: 6 }} />
          <Text style={styles.faqSectionTitle}>
            {t("faqs") || "Frequently Asked Questions"}
          </Text>
        </View>

        <View style={styles.faqList}>
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
                onPress={() => setExpandedFaq(isExpanded ? null : index)}
                activeOpacity={0.8}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color="#5D4037"
                  />
                </View>
                {isExpanded && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
  },
  stepsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  stepsHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  stepsList: {
    gap: 14,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF8E1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 11,
    color: "#616161",
    lineHeight: 16,
  },
  faqSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  faqHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  faqList: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.04)",
  },
  faqItemExpanded: {
    backgroundColor: "#FFFDE7",
    borderColor: "rgba(212, 175, 55, 0.3)",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    color: "#2C1810",
    paddingRight: 8,
    lineHeight: 17,
  },
  faqAnswer: {
    fontSize: 11,
    color: "#5D4037",
    marginTop: 8,
    lineHeight: 16,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.05)",
  },
});

export default RedeemFaqSectionV2;

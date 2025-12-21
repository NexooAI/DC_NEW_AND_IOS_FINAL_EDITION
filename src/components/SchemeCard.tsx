import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "@/constants/theme";

type SchemeCardProps = {
  schemeName: string;
  isActive: boolean;
  name: string;
  accountNo: string;
  amountPaid: string; // e.g. "40000"
  amountTotal: string; // e.g. "55000"
  monthsPaid: string; // e.g. "8"
  monthsTotal: string; // e.g. "11"
  installment: string; // e.g. "5000"
  doj: string; // e.g. "Aug 3, 2024"
  dom: string; // e.g. "Jul 3, 2025"
  totalWeight: string; // e.g. "5.468 g"
  branch: string;
  giftIssued: string;
  cGoldValue: string;
  onPayNow?: () => void;
};

const SchemeCard: React.FC<SchemeCardProps> = ({
  schemeName,
  isActive,
  name,
  accountNo,
  amountPaid,
  amountTotal,
  monthsPaid,
  monthsTotal,
  installment,
  doj,
  dom,
  totalWeight,
  branch,
  giftIssued,
  cGoldValue,
  onPayNow,
}) => {
  return (
    <LinearGradient
      colors={[theme.colors.goldLight, theme.colors.goldDark]}
      style={styles.cardContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top Row: Scheme Name + Active Status */}
      <View style={styles.topRow}>
        <Text style={styles.schemeTitle}>{schemeName}</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusDot, isActive && styles.activeDot]}>
            ●
          </Text>
          <Text style={styles.statusText}>
            {isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>

      {/* Name & Account No */}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.accountNo}>{accountNo}</Text>

      {/* Row 1: Amount Status, Months, Installment */}
      <View style={styles.infoRow}>
        <View style={styles.infoColumn}>
          <Text style={styles.label}>Amount Status</Text>
          <Text style={styles.value}>
            ₹{amountPaid} / ₹{amountTotal}
          </Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>Months</Text>
          <Text style={styles.value}>
            {monthsPaid} / {monthsTotal}
          </Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>Installment</Text>
          <Text style={styles.value}>₹{installment}</Text>
        </View>
      </View>

      {/* Row 2: DOJ, DOM, Total Weight */}
      <View style={styles.infoRow}>
        <View style={styles.infoColumn}>
          <Text style={styles.label}>DOJ</Text>
          <Text style={styles.value}>{doj}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>DOM</Text>
          <Text style={styles.value}>{dom}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>Total Weight</Text>
          <Text style={styles.value}>{totalWeight}</Text>
        </View>
      </View>

      {/* Row 3: Branch, Gift Issued, C.GoldValue */}
      <View style={styles.infoRow}>
        <View style={styles.infoColumn}>
          <Text style={styles.label}>Branch</Text>
          <Text style={styles.value}>{branch}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>Gift Issued</Text>
          <Text style={styles.value}>{giftIssued}</Text>
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.label}>C.GoldValue</Text>
          <Text style={styles.value}>Rs {cGoldValue}</Text>
        </View>
      </View>

      {/* Pay Now Button */}
      <TouchableOpacity style={styles.payButton} onPress={onPayNow}>
        <Text style={styles.payButtonText}>Pay Now</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default SchemeCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: "95%",
    alignSelf: "center",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    // iOS shadow
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    // Android shadow
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  schemeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.white,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    color: theme.colors.textLightGrey,
    marginRight: 4,
  },
  activeDot: {
    color: theme.colors.success,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  name: {
    fontSize: 18,
    color: theme.colors.white,
    marginBottom: 2,
  },
  accountNo: {
    fontSize: 14,
    color: theme.colors.white,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoColumn: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    color: theme.colors.white,
    marginTop: 2,
  },
  payButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignSelf: "flex-end",
    borderRadius: 6,
    marginTop: 8,
  },
  payButtonText: {
    color: theme.colors.white,
    fontWeight: "bold",
  },
});

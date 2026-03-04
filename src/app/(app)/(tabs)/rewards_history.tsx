import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";

export default function RewardsHistoryScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    // Placeholder data
    const transactionRecords = [
        {
            id: "1",
            type: "EARN",
            title: "Referred Friend (John Doe)",
            points: "+250",
            date: "12 Oct 2023",
            time: "10:30 AM",
        },
        {
            id: "2",
            type: "REDEEM",
            title: "Scheme Payment Offset",
            points: "-150",
            date: "05 Oct 2023",
            time: "02:15 PM",
        },
        {
            id: "3",
            type: "EARN",
            title: "Referred Friend (Jane Smith)",
            points: "+50",
            date: "28 Sep 2023",
            time: "09:00 AM",
        }
    ];

    const renderTransactionItem = ({ item }: { item: any }) => {
        const isEarn = item.type === "EARN";

        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionIconContainer}>
                    <Ionicons
                        name={isEarn ? "arrow-down-circle" : "arrow-up-circle"}
                        size={32}
                        color={isEarn ? "#4CAF50" : "#F44336"}
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{item.title}</Text>
                    <Text style={styles.transactionDate}>{item.date} • {item.time}</Text>
                </View>
                <View style={styles.transactionPointsContainer}>
                    <Text style={[
                        styles.transactionPoints,
                        { color: isEarn ? "#4CAF50" : "#F44336" }
                    ]}>
                        {item.points}
                    </Text>
                    <Text style={styles.pointsLabel}>{t("points") || "Pts"}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <LinearGradient
                colors={["#F2E6D2", "#F5DEB3"]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("rewardHistory") || "Reward History"}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </LinearGradient>

            <View style={styles.contentContainer}>
                {transactionRecords.length > 0 ? (
                    <FlatList
                        data={transactionRecords}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTransactionItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>{t("noTransactions") || "No recent transactions found"}</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f7fa",
    },
    headerGradient: {
        paddingBottom: 15,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 10 : 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },
    transactionCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    transactionIconContainer: {
        marginRight: 16,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 12,
        color: "#888",
    },
    transactionPointsContainer: {
        alignItems: "flex-end",
    },
    transactionPoints: {
        fontSize: 18,
        fontWeight: "800",
    },
    pointsLabel: {
        fontSize: 11,
        color: "#666",
        marginTop: 2,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: "#888",
    }
});

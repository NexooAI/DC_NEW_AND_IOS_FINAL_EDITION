import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { rewardsAPI } from "@/services/api";
import useGlobalStore from "@/store/global.store";
import { useEffect, useState, useCallback } from "react";

export default function RewardsHistoryScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useGlobalStore();
    const [referrals, setReferrals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchReferrals = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const response = await rewardsAPI.getMyReferrals(user.id);
            if (response.data.success && Array.isArray(response.data.data)) {
                setReferrals(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching referrals:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchReferrals();
    }, [fetchReferrals]);

    const renderTransactionItem = ({ item }: { item: any }) => {
        const isEarn = true; // All from this API are earned rewards
        
        // Manual date formatting instead of moment
        const dateObj = new Date(item.joined_at);
        const formattedDate = dateObj.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const formattedTime = dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionIconContainer}>
                    <Ionicons
                        name={"arrow-down-circle"}
                        size={32}
                        color={"#4CAF50"}
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>{item.name}</Text>
                    <Text style={styles.transactionSubtitle}>{item.mobile_number}</Text>
                    <Text style={styles.transactionDate}>{formattedDate} • {formattedTime}</Text>
                </View>
                <View style={styles.transactionPointsContainer}>
                    <Text style={[
                        styles.transactionPoints,
                        { color: "#4CAF50" }
                    ]}>
                        +{item.reward_earned}
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
                {referrals.length > 0 ? (
                    <FlatList
                        data={referrals}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderTransactionItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={fetchReferrals}
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
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    transactionSubtitle: {
        fontSize: 13,
        color: "#444",
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

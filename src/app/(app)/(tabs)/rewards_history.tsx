import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Modal, BackHandler, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { rewardsAPI } from "@/services/api";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useEffect, useState, useCallback } from "react";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";

const { wp, hp, rf } = responsiveUtils;

export default function RewardsHistoryScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useGlobalStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const fetchTransactions = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const response = await rewardsAPI.getWalletInfo(user.id);
            if (response.data.success && response.data.data && Array.isArray(response.data.data.history)) {
                setTransactions(response.data.data.history);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle("dark-content");
            if (Platform.OS === "android") {
                StatusBar.setBackgroundColor("#F2E6D2");
                StatusBar.setTranslucent(false);
            }
            fetchTransactions();
        }, [fetchTransactions])
    );

    useEffect(() => {
        const handleBackPress = () => {
            router.replace("/(app)/(tabs)/rewards");
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            handleBackPress
        );

        return () => backHandler.remove();
    }, [router]);

    const handleItemPress = (item: any) => {
        setSelectedItem(item);
        setDetailsModalVisible(true);
    };

    const renderTransactionItem = ({ item }: { item: any }) => {
        const isReferral = item.type === "referral";

        // Manual date formatting instead of moment
        const dateObj = new Date(item.created_at);
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

        const formattedStatus = item.status ? (t("status_" + item.status) || (item.status.charAt(0).toUpperCase() + item.status.slice(1))) : "";

        return (
            <TouchableOpacity
                style={styles.transactionCard}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.transactionIconContainer}>
                    <Ionicons
                        name={isReferral ? "arrow-down-circle" : "arrow-up-circle"}
                        size={32}
                        color={isReferral ? "#4CAF50" : "#F44336"}
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                        {isReferral ? item.description : (t("points_redeemed") || "Points Redeemed")}
                    </Text>
                    <Text style={styles.transactionSubtitle}>
                        {isReferral ? (item.mobile_number || "") : item.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {formattedDate} • {formattedTime} {formattedStatus ? `• ${formattedStatus}` : ""}
                    </Text>
                </View>
                <View style={styles.transactionPointsContainer}>
                    <Text style={[
                        styles.transactionPoints,
                        { color: isReferral ? "#4CAF50" : "#F44336" }
                    ]}>
                        {isReferral ? `+${item.points}` : `-${item.points}`}
                    </Text>
                    <Text style={styles.pointsLabel}>{t("points") || "Pts"}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : ['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2E6D2" />
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(app)/(tabs)/rewards")}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.textDark}>
                            {t("rewardHistory") || "Reward History"}
                        </ResponsiveText>
                    </View>

                    <View style={styles.headerRightPlaceholder} />
                </View>
            </View>

            <View style={styles.contentContainer}>
                {transactions.length > 0 ? (
                    <FlatList
                        data={transactions}
                        keyExtractor={(item, index) => `${item.type}_${item.id}_${index}`}
                        renderItem={renderTransactionItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={fetchTransactions}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>{t("noTransactions") || "No recent transactions found"}</Text>
                    </View>
                )}
            </View>

            {/* Reward Detail Modal */}
            <Modal
                visible={detailsModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.textDark}>
                                {selectedItem?.type === 'referral' ? (t("rewardDetails") || "Reward Details") : (t("redemptionDetails") || "Redemption Details")}
                            </ResponsiveText>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#ccc" />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <View style={styles.modalBody}>
                                {selectedItem.type === 'referral' ? (
                                    <>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("customerName") || "Customer Name"}</Text>
                                            <Text style={styles.detailValue}>{selectedItem.description}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("mobileNumberLabel") || "Mobile Number"}</Text>
                                            <Text style={styles.detailValue}>{selectedItem.mobile_number}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("joinedDate") || "Joined Date"}</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(selectedItem.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("transactionType") || "Transaction Type"}</Text>
                                            <Text style={styles.detailValue}>{t("points_redeemed") || "Points Redeemed"}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("details") || "Details"}</Text>
                                            <Text style={styles.detailValue}>{selectedItem.description}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("transactionDate") || "Transaction Date"}</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(selectedItem.created_at).toLocaleDateString('en-IN', {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        {selectedItem.type === 'referral' ? (t("pointsEarned") || "Points Earned") : (t("pointsRedeemed") || "Points Redeemed")}
                                    </Text>
                                    <View style={[
                                        styles.pointsBadge,
                                        { backgroundColor: selectedItem.type === 'referral' ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)" }
                                    ]}>
                                        <Text style={[
                                            styles.pointsBadgeText,
                                            { color: selectedItem.type === 'referral' ? "#4CAF50" : "#F44336" }
                                        ]}>
                                            {selectedItem.type === 'referral' ? `+${selectedItem.points}` : `-${selectedItem.points}`} {t("points") || "Pts"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{t("statusLabel") || "Status"}</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: selectedItem.status === 'completed' || selectedItem.status === 'credited' ? "#4CAF50" : selectedItem.status === 'rejected' ? "#F44336" : "#FF9800" }
                                    ]}>
                                        {selectedItem.status ? (t("status_" + selectedItem.status) || (selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1))) : ""}
                                    </Text>
                                </View>
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{t("referenceId") || "Reference ID"}</Text>
                                    <Text style={styles.detailValue}>
                                        {selectedItem.type === 'referral' ? '#REF-' : '#RED-'}
                                        {selectedItem.id ? selectedItem.id.toString().padStart(4, '0') : "0000"}
                                    </Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.closeBtn}
                                    onPress={() => setDetailsModalVisible(false)}
                                >
                                    <Text style={styles.closeBtnText}>{t("close")?.toUpperCase() || "CLOSE"}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function getStyles(theme: any) { return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2E6D2",
    },
    headerContainer: {
        backgroundColor: "#F2E6D2",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: wp(5),
        paddingVertical: hp(1.5),
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        zIndex: 10,
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRightPlaceholder: {
        width: 40, // Match backButton width for centering
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        minHeight: 400,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    modalBody: {
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },
    detailLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    detailValue: {
        fontSize: 15,
        color: "#1a1a1a",
        fontWeight: "700",
    },
    detailDivider: {
        height: 1,
        backgroundColor: "#f0f0f0",
    },
    pointsBadge: {
        backgroundColor: "rgba(76,175,80,0.1)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    pointsBadgeText: {
        color: "#4CAF50",
        fontWeight: "bold",
        fontSize: 14,
    },
    closeBtn: {
        backgroundColor: theme.colors.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 32,
    },
    closeBtnText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "bold",
        letterSpacing: 1,
    }
}) }

var styles = getStyles(theme);;

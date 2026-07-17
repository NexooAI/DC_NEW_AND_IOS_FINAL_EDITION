import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform, Modal, BackHandler, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { rewardsAPI } from "@/services/api";
import useGlobalStore from "@/store/global.store";
import { useEffect, useState, useCallback } from "react";
import ResponsiveText from "@/components/ResponsiveText";
import { responsiveUtils } from "@/utils/responsiveUtils";
import { formatDate, formatTime, convertUTCToLocal } from "@/utils/dateTimeUtils";

const { wp, hp, rf } = responsiveUtils;

export default function RewardsHistoryScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { user } = useGlobalStore();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);

    const isAddition = selectedItem?.type === 'referral' || selectedItem?.type === 'lucky_draw';
    const isLuckyDraw = selectedItem?.type === 'lucky_draw';

    // Filters and pagination states
    const [filter, setFilter] = useState<"all" | "referral_install" | "referral_investment" | "lucky_draw" | "redemption">("all");
    const [visibleCount, setVisibleCount] = useState(10);

    const fetchTransactions = useCallback(async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const response = await rewardsAPI.getWalletInfo(user.id, filter);
            if (response.data.success && response.data.data && Array.isArray(response.data.data.history)) {
                setTransactions(response.data.data.history);
            }
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id, filter]);

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
        fetchTransactions();
    }, [filter, fetchTransactions]);

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

    // Reset pagination when filter changes
    useEffect(() => {
        setVisibleCount(10);
    }, [filter]);

    const handleItemPress = (item: any) => {
        setSelectedItem(item);
        setDetailsModalVisible(true);
    };

    const renderTransactionItem = ({ item }: { item: any }) => {
        const isAddition = item.type === "referral" || item.type === "lucky_draw";
        const isLuckyDraw = item.type === "lucky_draw";

        const formattedDate = formatDate(item.created_at);
        const formattedTime = formatTime(item.created_at);

        const formattedStatus = item.status ? (t("status_" + item.status) || (item.status.charAt(0).toUpperCase() + item.status.slice(1))) : "";

        let iconName = "arrow-down-circle";
        let iconColor = "#4CAF50";
        if (item.type === "lucky_draw") {
            iconName = "trophy";
            iconColor = "#FFD700"; // Gold
        } else if (item.type === "redemption") {
            iconName = "arrow-up-circle";
            iconColor = "#F44336";
        }

        return (
            <TouchableOpacity
                style={styles.transactionCard}
                onPress={() => handleItemPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.transactionIconContainer}>
                    <Ionicons
                        name={iconName as any}
                        size={32}
                        color={iconColor}
                    />
                </View>
                <View style={styles.transactionDetails}>
                    <Text style={styles.transactionTitle}>
                        {item.type === "referral" ? item.description : isLuckyDraw ? item.description : (t("points_redeemed") || "Points Redeemed")}
                    </Text>
                    <Text style={styles.transactionSubtitle}>
                        {item.type === "referral" ? (item.mobile_number || "") : isLuckyDraw ? (t("lucky_draw_points") || "Lucky Draw Reward") : item.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                        {formattedDate} • {formattedTime} {formattedStatus ? `• ${formattedStatus}` : ""}
                    </Text>
                </View>
                <View style={styles.transactionPointsContainer}>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: isAddition ? "rgba(76, 175, 80, 0.12)" : "rgba(244, 67, 54, 0.12)" }
                    ]}>
                        <Text style={[
                            styles.statusBadgeText,
                            { color: isAddition ? "#4CAF50" : "#F44336" }
                        ]}>
                            {isAddition ? "Added" : "Deducted"}
                        </Text>
                    </View>
                    <Text style={[
                        styles.transactionPoints,
                        { color: isAddition ? "#4CAF50" : "#F44336", marginTop: 4 }
                    ]}>
                        {isAddition ? `+${item.points}` : `-${item.points}`} Pts
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = (title: string) => {
        return (
            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionHeaderTitle}>{title}</Text>
                <View style={styles.sectionHeaderLine} />
            </View>
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        if (item.isHeader) {
            return renderSectionHeader(item.title);
        }
        return renderTransactionItem({ item });
    };

    const renderFooter = () => {
        if (filteredTransactions.length <= visibleCount) return null;
        return (
            <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => setVisibleCount(prev => prev + 10)}
                activeOpacity={0.8}
            >
                <Text style={styles.loadMoreText}>
                    {t("loadMore") || "LOAD MORE"}
                </Text>
            </TouchableOpacity>
        );
    };

    // Filter transactions (since we fetch filtered list from backend, we just return true)
    const filteredTransactions = transactions;

    // Sort descending
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        return convertUTCToLocal(b.created_at).getTime() - convertUTCToLocal(a.created_at).getTime();
    });

    // Slice to current visible count
    const paginatedTransactions = sortedTransactions.slice(0, visibleCount);

    // Grouping logic for "Recently Active" (last 7 days) and chronological years
    const getGroupedData = () => {
        const now = new Date();
        const groupedByYear: Record<string, any[]> = {};
        const currentYear = new Date().getFullYear().toString();

        paginatedTransactions.forEach(t => {
            const date = convertUTCToLocal(t.created_at);
            const year = date.getFullYear().toString();
            if (year === currentYear) {
                if (!groupedByYear[currentYear]) {
                    groupedByYear[currentYear] = [];
                }
                groupedByYear[currentYear].push(t);
            } else {
                if (!groupedByYear[year]) {
                    groupedByYear[year] = [];
                }
                groupedByYear[year].push(t);
            }
        });

        const sections: { title: string; data: any[] }[] = [];
        if (groupedByYear[currentYear] && groupedByYear[currentYear].length > 0) {
            sections.push({ title: t("recentlyActive") || "Recently Active", data: groupedByYear[currentYear] });
        }

        const years = Object.keys(groupedByYear).filter(y => y !== currentYear).sort((a, b) => b.localeCompare(a));
        years.forEach(year => {
            sections.push({ title: year, data: groupedByYear[year] });
        });

        return sections;
    };

    const sections = getGroupedData();
    const flatListData: any[] = [];
    sections.forEach(sec => {
        flatListData.push({ isHeader: true, title: sec.title });
        sec.data.forEach(item => {
            flatListData.push({ isHeader: false, ...item });
        });
    });

    return (
        <SafeAreaView style={styles.container} edges={Platform.OS === 'ios' ? ['left', 'right'] : ['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2E6D2" />
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(app)/(tabs)/rewards")}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
 
                    <View style={styles.titleContainer}>
                        <ResponsiveText variant="title" size="md" weight="bold" color={theme.colors.primary}>
                            {t("rewardHistory") || "Reward History"}
                        </ResponsiveText>
                    </View>
 
                    <View style={styles.headerRightPlaceholder} />
                </View>
            </View>
 
            {/* Filter Buttons Segment Container */}
            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === "all" && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter("all")}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === "all" && styles.filterTextActive
                        ]}>
                            {t("filterAll") || "All"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === "referral_install" && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter("referral_install")}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === "referral_install" && styles.filterTextActive
                        ]}>
                            {t("filterInstall") || "Install"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === "referral_investment" && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter("referral_investment")}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === "referral_investment" && styles.filterTextActive
                        ]}>
                            {t("filterInvestment") || "Investment"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === "lucky_draw" && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter("lucky_draw")}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === "lucky_draw" && styles.filterTextActive
                        ]}>
                            {t("filterLuckyDraw") || "Lucky Draw"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            filter === "redemption" && styles.filterButtonActive
                        ]}
                        onPress={() => setFilter("redemption")}
                        activeOpacity={0.8}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === "redemption" && styles.filterTextActive
                        ]}>
                            {t("filterRedeemed") || "Redeemed"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
 
            <View style={styles.contentContainer}>
                {flatListData.length > 0 ? (
                    <FlatList
                        data={flatListData}
                        keyExtractor={(item, index) => item.isHeader ? `header_${item.title}_${index}` : `${item.type}_${item.id}_${index}`}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshing={loading}
                        onRefresh={fetchTransactions}
                        ListFooterComponent={renderFooter}
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
                            <ResponsiveText variant="title" size="sm" weight="bold" color={theme.colors.primary}>
                                {selectedItem?.type === 'referral' ? (t("rewardDetails") || "Reward Details") : selectedItem?.type === 'lucky_draw' ? (t("luckyDrawDetails") || "Lucky Draw Details") : (t("redemptionDetails") || "Redemption Details")}
                            </ResponsiveText>
                            <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color="#ccc" />
                            </TouchableOpacity>
                        </View>
 
                        {selectedItem && (
                            <View style={styles.modalBody}>
                                {selectedItem.type === 'referral' && (
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
                                                {formatDate(selectedItem.created_at, {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                {selectedItem.type === 'lucky_draw' && (
                                    <>
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("rewardSource") || "Reward Source"}</Text>
                                            <Text style={styles.detailValue}>{t("lucky_draw") || "Lucky Draw"}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("details") || "Details"}</Text>
                                            <Text style={styles.detailValue}>{selectedItem.description}</Text>
                                        </View>
                                        <View style={styles.detailDivider} />
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{t("winDate") || "Win Date"}</Text>
                                            <Text style={styles.detailValue}>
                                                {formatDate(selectedItem.created_at, {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                {selectedItem.type === 'redemption' && (
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
                                                {formatDate(selectedItem.created_at, {
                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                })}
                                            </Text>
                                        </View>
                                    </>
                                )}
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>
                                        {isAddition ? (t("pointsEarned") || "Points Earned") : (t("pointsRedeemed") || "Points Redeemed")}
                                    </Text>
                                    <View style={[
                                        styles.pointsBadge,
                                        { backgroundColor: isAddition ? "rgba(76,175,80,0.1)" : "rgba(244,67,54,0.1)" }
                                    ]}>
                                        <Text style={[
                                            styles.pointsBadgeText,
                                            { color: isAddition ? "#4CAF50" : "#F44336" }
                                        ]}>
                                            {isAddition ? `+${selectedItem.points}` : `-${selectedItem.points}`} {t("points") || "Pts"}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{t("statusLabel") || "Status"}</Text>
                                    <Text style={[
                                        styles.detailValue,
                                        { color: selectedItem.status === 'completed' || selectedItem.status === 'credited' || selectedItem.status === 'credited_investment' ? "#4CAF50" : selectedItem.status === 'rejected' ? "#F44336" : "#FF9800" }
                                    ]}>
                                        {selectedItem.status ? (t("status_" + selectedItem.status) || (selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1))) : ""}
                                    </Text>
                                </View>
                                <View style={styles.detailDivider} />
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>{t("referenceId") || "Reference ID"}</Text>
                                    <Text style={styles.detailValue}>
                                        {isLuckyDraw ? '#LDW-' : selectedItem.type === 'referral' ? '#REF-' : '#RED-'}
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

const styles = StyleSheet.create({
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
    filterWrapper: {
        paddingHorizontal: 16,
        marginVertical: 12,
    },
    filterContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: "#160507", // Deep black-burgundy
        borderWidth: 1,
        borderColor: "rgba(212, 175, 55, 0.25)",
    },
    filterButtonActive: {
        backgroundColor: "#FFD700", // Gold active background
        borderColor: "#D4AF37",
    },
    filterText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#E5A93C", // Soft gold inactive text
    },
    filterTextActive: {
        color: "#160507", // Dark black-burgundy active text
    },
    sectionHeaderContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    sectionHeaderTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.colors.primary, // Burgundy
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    sectionHeaderLine: {
        flex: 1,
        height: 1,
        backgroundColor: "rgba(133, 1, 17, 0.15)", // Muted burgundy line
        marginLeft: 12,
    },
    loadMoreBtn: {
        backgroundColor: "#fff",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(133, 1, 17, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    loadMoreText: {
        color: theme.colors.primary,
        fontWeight: "bold",
        fontSize: 12,
        letterSpacing: 1,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    listContent: {
        paddingTop: 10,
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
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});

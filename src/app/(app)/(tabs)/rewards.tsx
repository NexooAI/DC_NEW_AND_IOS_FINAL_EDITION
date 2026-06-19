import React, { useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Modal,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter, useFocusEffect } from "expo-router";
import { rewardsAPI, investmentAPI } from "@/services/api";
import useGlobalStore from "@/store/global.store";


export default function RewardsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { user } = useGlobalStore();
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasInvestments, setHasInvestments] = useState<boolean | null>(null);
    const [redemptionModalVisible, setRedemptionModalVisible] = useState(false);
    const [noInvestmentModalVisible, setNoInvestmentModalVisible] = useState(false);
    const scrollY = useRef(new Animated.Value(0)).current;

    const fetchRewards = useCallback(async (showLoader = true) => {
        if (!user?.id) return;

        if (showLoader) setLoading(true);
        try {
            const response = await rewardsAPI.getMyReferrals(user.id);
            if (response.data.success && Array.isArray(response.data.data)) {
                const total = response.data.data.reduce((sum: number, item: any) => sum + (item.reward_earned || 0), 0);
                setTotalPoints(total);
            }
        } catch (error) {
            console.error("Error fetching rewards:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRewards(false);
    }, [fetchRewards]);

    const checkInvestments = async () => {
        if (!user?.id) return false;

        try {
            // Using user_investments endpoint to match MySchemesContent.tsx logic
            const response = await investmentAPI.getUserInvestments(user.id);

            // Accept both 'data' and 'investments' as possible array fields, similar to MySchemesContent.tsx
            const investments = Array.isArray(response?.data?.data)
                ? response.data.data
                : (Array.isArray(response?.data?.investments) ? response.data.investments : []);

            // Check for at least one active investment
            const active = investments.length > 0;

            setHasInvestments(active);
            return active;
        } catch (error) {
            console.error("Error checking investments:", error);
            // Default to false on error to be safe
            setHasInvestments(false);
            return false;
        }
    };

    const handleRedeemPress = async () => {
        setLoading(true);
        const active = await checkInvestments();
        setLoading(false);

        if (active) {
            setRedemptionModalVisible(true);
        } else {
            setNoInvestmentModalVisible(true);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchRewards(true);
        }, [fetchRewards])
    );

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const headerTranslateY = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [-150, 0],
        extrapolate: "clamp",
    });

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <LinearGradient
                colors={["#F2E6D2", "#F5DEB3"]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            {/* Sunburst background effect (subtle on peach background) */}
            <View style={styles.sunburstContainer}>
                {[...Array(12)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.sunburstRay,
                            { transform: [{ rotate: `${i * 30}deg` }] },
                        ]}
                    />
                ))}
            </View>

            {/* Sticky Header */}
            <Animated.View
                style={[
                    styles.stickyHeader,
                    {
                        opacity: headerOpacity,
                        transform: [{ translateY: headerTranslateY }],
                    },
                ]}
            >
                <LinearGradient
                    colors={["#F2E6D2", "#F5DEB3"]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />
                <View style={styles.stickyHeaderContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("rewardPoints") || "Reward Points"}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            style={styles.refreshRoundButton}
                            onPress={handleRefresh}
                        >
                            <Ionicons name="refresh" size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.historyPillButton}
                            onPress={() => router.push("/(app)/(tabs)/rewards_history")}
                        >
                            <Text style={styles.historyPillText}>History</Text>
                            <Ionicons name="receipt-outline" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>


            <Animated.ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("rewardPoints") || "Reward Points"}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            style={styles.refreshRoundButton}
                            onPress={handleRefresh}
                        >
                            <Ionicons name="refresh" size={18} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.historyPillButton}
                            onPress={() => router.push("/(app)/(tabs)/rewards_history")}
                        >
                            <Text style={styles.historyPillText}>History</Text>
                            <Ionicons name="receipt-outline" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Points Display */}
                <View style={styles.pointsContainer}>
                    <FontAwesome5 name="coins" size={32} color="#FF8C00" style={styles.coinIcon} />
                    <Text style={styles.pointsText}>{totalPoints}</Text>
                </View>
                <View style={styles.conversionBadge}>
                    <FontAwesome5 name="coins" size={12} color="#FF8C00" />
                    <Text style={styles.conversionText}> {t("conversionText") || "1 = ₹1"}</Text>
                </View>

                {/* Treasure Chest Placeholder Graphic */}
                <View style={styles.chestGraphicContainer}>
                    <FontAwesome5 name="box-open" size={120} color="#FF8C00" />
                    <View style={styles.chestCoins}>
                        <FontAwesome5 name="coins" size={50} color="#FFA500" />
                    </View>
                </View>

                {/* Steps to Redeem Card */}
                <View style={styles.stepsCard}>
                    <View style={styles.stepsCardHeader}>
                        <Text style={styles.stepsCardTitle}>{t("stepsToRedeem") || "Steps To Redeem"}</Text>
                        <FontAwesome5 name="star" size={18} color="#FFD700" solid />
                    </View>

                    <View style={styles.stepsList}>
                        {/* Step 1 */}
                        <View style={styles.stepCardItem}>
                            <View style={styles.stepIconContainer}>
                                <Ionicons name="options-outline" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{t("chooseHowToRedeem") || "Choose How to Redeem"}</Text>
                                <Text style={styles.stepDescription}>
                                    {t("chooseHowToRedeemDesc") || "Select whether you want to use your points with a scheme or for a product purchase."}
                                </Text>
                            </View>
                        </View>

                        {/* Step 2 */}
                        <View style={styles.stepCardItem}>
                            <View style={styles.stepIconContainer}>
                                <Ionicons name="push-outline" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{t("submitYourRequest") || "Submit Your Request"}</Text>
                                <Text style={styles.stepDescription}>
                                    {t("submitYourRequestDesc") || "Enter the number of points to redeem and submit your request."}
                                </Text>
                            </View>
                        </View>

                        {/* Step 3 */}
                        <View style={styles.stepCardItem}>
                            <View style={styles.stepIconContainer}>
                                <Ionicons name="storefront-outline" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.stepContent}>
                                <Text style={styles.stepTitle}>{t("visitStoreRedeem") || "Visit the Store & Redeem"}</Text>
                                <Text style={styles.stepDescription}>
                                    {t("visitStoreRedeemDesc") || "Visit the store and redeem your approved points while making your purchase."}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Refer & Earn Navigation Card */}
                <View style={styles.referCardContainer}>
                    <TouchableOpacity
                        style={styles.referCard}
                        activeOpacity={0.8}
                        onPress={() => router.push("/home/refer_earn")}
                    >
                        <LinearGradient
                            colors={['#ffffff', '#fcfcfc']}
                            style={styles.referCardGradient}
                        >
                            <View style={styles.referIconContainer}>
                                <Ionicons name="people" size={28} color={theme.colors.primary} />
                            </View>
                            <View style={styles.referContent}>
                                <Text style={styles.referTitle}>{t("referAndEarn") || "Refer & Earn"}</Text>
                                <Text style={styles.referSubtitle}>{t("refer_earn_subtitle") || "Invite friends and earn exciting rewards"}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

            </Animated.ScrollView>

            {/* Floating Action Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.redeemButton}
                    activeOpacity={0.9}
                    onPress={handleRedeemPress}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={[theme.colors.primary, "#002b24"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.redeemGradient}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.redeemButtonText}>{t("redeemPoints") || "Redeem Points"}</Text>
                        )}
                        <Ionicons name="sparkles" size={16} color="#FFD700" style={{ position: "absolute", top: 10, left: 20 }} />
                        <Ionicons name="sparkles" size={24} color="#FFD700" style={{ position: "absolute", bottom: 10, right: 20 }} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* No Investment Modal */}
            <Modal
                visible={noInvestmentModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setNoInvestmentModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="alert-circle" size={48} color="#FF8C00" />
                            <Text style={styles.modalTitle}>{t("investFirst") || "Invest First!"}</Text>
                        </View>
                        <Text style={styles.modalDescription}>
                            {t("noInvestmentDesc") || "You need at least one active scheme or investment to redeem your reward points."}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={() => {
                                setNoInvestmentModalVisible(false);
                                router.push("/(app)/(tabs)/home/schemes");
                            }}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, "#002b24"]}
                                style={styles.modalButtonGradient}
                            >
                                <Text style={styles.modalButtonText}>{t("clickToJoinScheme") || "Click to Join Scheme"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setNoInvestmentModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>{t("close") || "Close"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Redemption Modal */}
            <Modal
                visible={redemptionModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRedemptionModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="gift" size={48} color={theme.colors.primary} />
                            <Text style={styles.modalTitle}>{t("redeemAtShop") || "Redeem at Shop"}</Text>
                        </View>
                        <View style={styles.modalPointsContainer}>
                            <Text style={styles.modalPointsValue}>{totalPoints}</Text>
                            <Text style={styles.modalPointsLabel}>{t("pointsAvailable") || "Points Available"}</Text>
                        </View>
                        <Text style={styles.modalDescription}>
                            {t("redemptionDesc") || "Visit our physical store to redeem these points against your purchase. Our staff will assist you with the redemption process."}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={() => setRedemptionModalVisible(false)}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, "#002b24"]}
                                style={styles.modalButtonGradient}
                            >
                                <Text style={styles.modalButtonText}>{t("gotIt") || "Got It"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 150,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 340,
        alignItems: "center",
    },
    modalHeader: {
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1a1a1a",
        marginTop: 12,
        textAlign: "center",
    },
    modalDescription: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    modalPointsContainer: {
        backgroundColor: "#f9fcff",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#eef2f5",
    },
    modalPointsValue: {
        fontSize: 40,
        fontWeight: "800",
        color: "#FF8C00",
    },
    modalPointsLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "600",
        marginTop: 4,
    },
    modalActionButton: {
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
    },
    modalButtonGradient: {
        paddingVertical: 14,
        alignItems: "center",
    },
    modalButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    modalCloseButton: {
        padding: 8,
    },
    modalCloseText: {
        color: "#666",
        fontSize: 14,
        fontWeight: "600",
    },
    sunburstContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.1,
    },
    sunburstRay: {
        position: "absolute",
        width: "200%",
        height: 40,
        backgroundColor: "#fff",
    },
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 90 : 70,
        zIndex: 100,
        elevation: 5,
    },
    stickyHeaderContent: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1a1a1a",
    },
    historyPillButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    historyPillText: {
        color: "white",
        fontSize: 12,
        fontWeight: "700",
    },
    pointsContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    coinIcon: {
        marginRight: 12,
    },
    pointsText: {
        fontSize: 56,
        fontWeight: "800",
        color: "#1a1a1a",
    },
    conversionBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center",
        backgroundColor: "rgba(255, 255, 255, 0.4)",
        borderWidth: 1,
        borderColor: "#FF8C00",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 30,
    },
    conversionText: {
        color: "#1a1a1a",
        fontSize: 14,
        fontWeight: "700",
        marginLeft: 6,
    },
    chestGraphicContainer: {
        alignItems: "center",
        justifyContent: "center",
        height: 200,
        marginBottom: 30,
    },
    chestCoins: {
        position: "absolute",
        top: 30,
        zIndex: -1,
    },
    stepsCard: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginHorizontal: 16,
        padding: 24,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
            },
            android: {
                elevation: 10,
            },
        }),
    },
    stepsCardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#f0f0f0",
        paddingBottom: 16,
    },
    stepsCardTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#4e545c",
    },
    stepsList: {
        marginTop: 5,
    },
    stepCardItem: {
        flexDirection: "row",
        backgroundColor: "#f9fcff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#eef2f5",
    },
    stepIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: "rgba(0,0,0,0.04)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    stepContent: {
        flex: 1,
        justifyContent: "center",
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    stepDescription: {
        fontSize: 13,
        color: "#666",
        lineHeight: 18,
    },
    referCardContainer: {
        marginTop: 20,
        marginHorizontal: 16,
    },
    referCard: {
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    referCardGradient: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    referIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.05)",
        alignItems: "center",
        justifyContent: "center",
    },
    referContent: {
        flex: 1,
        paddingHorizontal: 12,
    },
    referTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    referSubtitle: {
        fontSize: 13,
        color: "#666",
    },
    refreshRoundButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.colors.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    bottomBar: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 20,
    },
    redeemButton: {
        borderRadius: 16,
        overflow: "hidden",
    },
    redeemGradient: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    redeemButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
});

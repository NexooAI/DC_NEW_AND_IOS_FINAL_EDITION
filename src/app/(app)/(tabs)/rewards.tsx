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
    StatusBar,
    TextInput,
    Alert,
    ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter, useFocusEffect, useNavigation } from "expo-router";
import { rewardsAPI, investmentAPI } from "@/services/api";
import useGlobalStore, { useAppTheme, getAppConfig } from "@/store/global.store";
import { useEffect } from "react";


const DISABLE_REDEMPTION_FORM = true; // Set to false to restore original redemption modal flow

export default function RewardsScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const navigation = useNavigation();
    const { user } = useGlobalStore();
    const [totalPoints, setTotalPoints] = useState(0);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasInvestments, setHasInvestments] = useState<boolean | null>(null);
    const [redemptionModalVisible, setRedemptionModalVisible] = useState(false);
    const [noInvestmentModalVisible, setNoInvestmentModalVisible] = useState(false);
    const [visitBranchModalVisible, setVisitBranchModalVisible] = useState(false);
    const chestScale = useRef(new Animated.Value(0)).current;
    const pointsScale = useRef(new Animated.Value(0)).current;
    const pointsTranslateY = useRef(new Animated.Value(30)).current;
    const [isChestOpen, setIsChestOpen] = useState(false);

    const [pointsToRedeem, setPointsToRedeem] = useState("");
    const [redemptionMethod, setRedemptionMethod] = useState<"purchase" | "cash">("purchase");
    const [paymentDetails, setPaymentDetails] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchRewards = useCallback(async (showLoader = true) => {
        if (!user?.id) return;

        if (showLoader) setLoading(true);
        try {
            const response = await rewardsAPI.getWalletInfo(user.id);
            if (response.data.success && response.data.data) {
                setTotalPoints(response.data.data.balance || 0);
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

    useEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: t("rewardPoints") || "Reward Points",
            headerStyle: {
                backgroundColor: "#F2E6D2",
                elevation: 0,
                shadowOpacity: 0,
                height: Platform.OS === 'android' ? (60 + insets.top) : 60,
            },
            headerStatusBarHeight: Platform.OS === 'android' ? insets.top : 0,
            headerTintColor: "#1a1a1a",
            headerTitleStyle: {
                fontWeight: "700",
                fontSize: 18,
            },
            headerLeft: () => (
                <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
            ),
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 16 }}>
                    {/* <TouchableOpacity
                        style={styles.refreshRoundButton}
                        onPress={handleRefresh}
                    >
                        <Ionicons name="refresh" size={18} color="white" />
                    </TouchableOpacity> */}
                    <TouchableOpacity
                        style={styles.historyPillButton}
                        onPress={() => router.push("/(app)/(tabs)/rewards_history")}
                    >
                        <Text style={styles.historyPillText}>History</Text>
                        <Ionicons name="receipt-outline" size={16} color="white" />
                    </TouchableOpacity>
                </View>
            ),
        });
    }, [navigation, handleRefresh, t, router]);

    const handleRedeemConfirm = async () => {
        const pts = parseInt(pointsToRedeem);
        if (isNaN(pts) || pts <= 0) {
            Alert.alert(t("error") || "Error", t("pleaseEnterValidPoints") || "Please enter a valid amount of points");
            return;
        }

        if (pts > totalPoints) {
            Alert.alert(t("error") || "Error", t("insufficientPoints") || "Insufficient points balance");
            return;
        }

        if (redemptionMethod === "cash" && !paymentDetails.trim()) {
            Alert.alert(t("error") || "Error", t("pleaseEnterPaymentDetails") || "Please enter payment details (UPI / Bank)");
            return;
        }

        setSubmitting(true);
        try {
            const methodLabel = redemptionMethod === "purchase" ? "purchase" : "cash";
            const detailsText = redemptionMethod === "purchase"
                ? "Redeem for jewelry purchase discount"
                : paymentDetails.trim();

            const response = await rewardsAPI.redeemPoints({
                points: pts,
                payment_method: methodLabel,
                payment_details: detailsText,
                userId: user?.id
            });

            if (response.data.success) {
                Alert.alert(
                    t("success") || "Success",
                    redemptionMethod === "purchase"
                        ? (t("purchaseRedeemSuccess") || "Purchase discount request submitted. You can redeem this when you purchase jewelry once your investments mature.")
                        : (t("cashRedeemSuccess") || "Cash payout request submitted. Admin will process it shortly."),
                    [{
                        text: t("ok") || "OK",
                        onPress: () => {
                            setRedemptionModalVisible(false);
                            setPointsToRedeem("");
                            setPaymentDetails("");
                            setRedemptionMethod("purchase");
                            fetchRewards(false);
                        }
                    }]
                );
            } else {
                Alert.alert(t("error") || "Error", response.data.message || "Redemption failed");
            }
        } catch (error: any) {
            console.error("Error submitting redemption:", error);
            const errMsg = error.response?.data?.error || error.message || "Failed to submit redemption request";
            Alert.alert(t("error") || "Error", errMsg);
        } finally {
            setSubmitting(false);
        }
    };

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
            if (DISABLE_REDEMPTION_FORM) {
                setVisitBranchModalVisible(true);
            } else {
                setRedemptionModalVisible(true);
            }
        } else {
            setNoInvestmentModalVisible(true);
        }
    };

    useFocusEffect(
        useCallback(() => {
            StatusBar.setBarStyle("dark-content");
            if (Platform.OS === "android") {
                StatusBar.setBackgroundColor("#F2E6D2");
                StatusBar.setTranslucent(false);
            }

            fetchRewards(true);

            // Reset animations
            chestScale.setValue(0);
            pointsScale.setValue(0);
            pointsTranslateY.setValue(30);
            setIsChestOpen(false);

            // Sequence of animations: chest scale springs up first
            Animated.sequence([
                Animated.spring(chestScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 40,
                    useNativeDriver: true,
                }),
                Animated.delay(200),
            ]).start(() => {
                // Open chest and trigger points pop-up
                setIsChestOpen(true);
                Animated.parallel([
                    Animated.spring(pointsScale, {
                        toValue: 1,
                        friction: 5,
                        tension: 45,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pointsTranslateY, {
                        toValue: -80,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ]).start();
            });
        }, [fetchRewards])
    );

    return (
        <SafeAreaView style={styles.container} edges={["bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F2E6D2" />
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

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* Points Display */}
                <View style={styles.pointsContainer}>
                    <FontAwesome5 name="coins" size={32} color="#FF8C00" style={styles.coinIcon} />
                    <Text style={styles.pointsText}>{totalPoints}</Text>
                </View>
                <View style={styles.conversionBadge}>
                    <FontAwesome5 name="coins" size={12} color="#FF8C00" />
                    <Text style={styles.conversionText}> {t("conversionText") || "1 = ₹1"}</Text>
                </View>

                {/* Treasure Chest Graphic with opening and points floating animation */}
                <View style={styles.chestGraphicContainer}>
                    <Animated.View style={{ transform: [{ scale: chestScale }] }}>
                        <FontAwesome5
                            name={isChestOpen ? "box-open" : "box"}
                            size={120}
                            color="#FF8C00"
                        />
                    </Animated.View>

                    {/* Pop-up float points animation */}
                    <Animated.View
                        style={[
                            styles.floatingPointsContainer,
                            {
                                opacity: pointsScale,
                                transform: [
                                    { scale: pointsScale },
                                    { translateY: pointsTranslateY }
                                ]
                            }
                        ]}
                    >
                        <LinearGradient
                            colors={["#FF8C00", "#FF5722"]}
                            style={styles.floatingBadge}
                        >
                            <FontAwesome5 name="coins" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.floatingPointsText}>
                                {totalPoints} {t("points") || "Pts"}
                            </Text>
                        </LinearGradient>
                    </Animated.View>
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
                                <Ionicons name="people" size={28} color={theme.colors.textDark} />
                            </View>
                            <View style={styles.referContent}>
                                <Text style={styles.referTitle}>{t("referAndEarn") || "Refer & Earn"}</Text>
                                <Text style={styles.referSubtitle}>{t("refer_earn_subtitle") || "Invite friends and earn exciting rewards"}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </LinearGradient>
                    </TouchableOpacity>
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
                                <Ionicons name="options-outline" size={24} color={theme.colors.textDark} />
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
                                <Ionicons name="push-outline" size={24} color={theme.colors.textDark} />
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
                                <Ionicons name="storefront-outline" size={24} color={theme.colors.textDark} />
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

            </ScrollView>

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

            {/* Visit Branch Modal */}
            <Modal
                visible={visitBranchModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVisitBranchModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="storefront-outline" size={48} color={theme.colors.textDark} />
                            <Text style={styles.modalTitle}>{t("visitBranchToRedeemTitle") || "Visit Branch to Redeem"}</Text>
                        </View>
                        <Text style={styles.modalDescription}>
                            {t("visitBranchToRedeemDesc") || "Please visit our showroom/branch directly to redeem your accumulated reward points."}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={() => setVisitBranchModalVisible(false)}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, "#002b24"]}
                                style={styles.modalButtonGradient}
                            >
                                <Text style={styles.modalButtonText}>{t("ok") || "OK"}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Redemption Modal */}
            <Modal
                visible={redemptionModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    if (!submitting) setRedemptionModalVisible(false);
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxWidth: 360 }]}>
                        <View style={styles.modalHeader}>
                            <Ionicons name="gift" size={40} color={theme.colors.textDark} />
                            <Text style={[styles.modalTitle, { fontSize: 20, marginTop: 8 }]}>
                                {t("redeemPoints") || "Redeem Points"}
                            </Text>
                        </View>

                        <View style={[styles.modalPointsContainer, { padding: 12, marginBottom: 12 }]}>
                            <Text style={[styles.modalPointsValue, { fontSize: 32 }]}>{totalPoints}</Text>
                            <Text style={styles.modalPointsLabel}>{t("pointsAvailable") || "Points Available"}</Text>
                        </View>

                        {/* Method Selector */}
                        <View style={styles.methodSelector}>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    redemptionMethod === "purchase" && styles.methodButtonActive
                                ]}
                                onPress={() => setRedemptionMethod("purchase")}
                                disabled={submitting}
                            >
                                <Text style={[
                                    styles.methodText,
                                    redemptionMethod === "purchase" && styles.methodTextActive
                                ]}>
                                    {t("purchaseDiscount") || "Purchase\nDiscount"}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.methodButton,
                                    redemptionMethod === "cash" && styles.methodButtonActive
                                ]}
                                onPress={() => setRedemptionMethod("cash")}
                                disabled={submitting}
                            >
                                <Text style={[
                                    styles.methodText,
                                    redemptionMethod === "cash" && styles.methodTextActive
                                ]}>
                                    {t("readyCashPayout") || "Direct Cash\nPayout"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Description/Input Area */}
                        {redemptionMethod === "purchase" ? (
                            <Text style={[styles.modalDescription, { fontSize: 13, marginBottom: 12, lineHeight: 18 }]}>
                                {t("purchaseRedemptionHelp") || "Points will be converted to a jewelry purchase discount. Redeemable at the store when your investment matures."}
                            </Text>
                        ) : (
                            <Text style={[styles.modalDescription, { fontSize: 13, marginBottom: 12, lineHeight: 18 }]}>
                                {t("cashRedemptionHelp") || "Points will be converted to a direct cash payout. Enter your UPI ID or bank account details below."}
                            </Text>
                        )}

                        <TextInput
                            style={styles.pointsInput}
                            keyboardType="number-pad"
                            placeholder={t("enterPointsToRedeem") || "Points to redeem"}
                            placeholderTextColor="#999"
                            value={pointsToRedeem}
                            onChangeText={setPointsToRedeem}
                            editable={!submitting}
                        />

                        {redemptionMethod === "cash" && (
                            <TextInput
                                style={styles.detailsInput}
                                placeholder={t("enterPaymentDetails") || "Enter UPI ID or Bank Account details"}
                                placeholderTextColor="#999"
                                value={paymentDetails}
                                onChangeText={setPaymentDetails}
                                multiline
                                editable={!submitting}
                            />
                        )}

                        <TouchableOpacity
                            style={styles.modalActionButton}
                            onPress={handleRedeemConfirm}
                            disabled={submitting}
                        >
                            <LinearGradient
                                colors={[theme.colors.primary, "#002b24"]}
                                style={styles.modalButtonGradient}
                            >
                                {submitting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalButtonText}>{t("confirmRedemption") || "Confirm Redemption"}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setRedemptionModalVisible(false)}
                            disabled={submitting}
                        >
                            <Text style={styles.modalCloseText}>{t("close") || "Close"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
}

function getStyles(theme: any) { return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F2E6D2",
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
    headerContainer: {
        backgroundColor: "transparent",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(0,0,0,0.05)",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
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
        marginTop: 20,
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
        height: 220,
        marginBottom: 30,
        position: "relative",
    },
    floatingPointsContainer: {
        position: "absolute",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
    },
    floatingBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    floatingPointsText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
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
        marginBottom: 20,
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
    pointsInput: {
        width: "100%",
        height: 50,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: "#1a1a1a",
        backgroundColor: "#f9f9f9",
        marginBottom: 16,
        textAlign: "center",
        fontWeight: "bold",
    },
    detailsInput: {
        width: "100%",
        height: 60,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        fontSize: 14,
        color: "#1a1a1a",
        backgroundColor: "#f9f9f9",
        marginBottom: 16,
        textAlignVertical: "top",
    },
    methodSelector: {
        flexDirection: "row",
        width: "100%",
        gap: 10,
        marginBottom: 16,
    },
    methodButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    methodButtonActive: {
        borderColor: theme.colors.primary,
        backgroundColor: "rgba(133,1,17,0.05)",
    },
    methodText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#666",
        textAlign: "center",
    },
    methodTextActive: {
        color: theme.colors.textDark,
    },
}) }

var styles = getStyles(theme);;

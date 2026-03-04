import React, { useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { theme } from "@/constants/theme";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "expo-router";

export default function RewardsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const scrollY = useRef(new Animated.Value(0)).current;

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [0, 1],
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
                    { opacity: headerOpacity },
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
                    <TouchableOpacity style={styles.historyButton} onPress={() => router.push("/(app)/(tabs)/rewards_history")}>
                        <Ionicons name="receipt-outline" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
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
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t("rewardPoints") || "Reward Points"}</Text>
                    <TouchableOpacity style={styles.historyButton} onPress={() => router.push("/(app)/(tabs)/rewards_history")}>
                        <Ionicons name="receipt-outline" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                </View>


                {/* Points Display */}
                <View style={styles.pointsContainer}>
                    <FontAwesome5 name="coins" size={32} color="#FF8C00" style={styles.coinIcon} />
                    <Text style={styles.pointsText}>0</Text>
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
                <TouchableOpacity style={styles.redeemButton} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[theme.colors.primary, "#002b24"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.redeemGradient}
                    >
                        <Text style={styles.redeemButtonText}>{t("redeemPoints") || "Redeem Points"}</Text>
                        <Ionicons name="sparkles" size={16} color="#FFD700" style={{ position: "absolute", top: 10, left: 20 }} />
                        <Ionicons name="sparkles" size={24} color="#FFD700" style={{ position: "absolute", bottom: 10, right: 20 }} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
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
    historyButton: {
        padding: 8,
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

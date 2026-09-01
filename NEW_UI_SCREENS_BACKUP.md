# 🌟 New UI Screens Code Backup (Rate Chart & Schemes)

This document contains the complete, ready-to-use source code for the new **Rate Chart Screen** and **Schemes Screen** with 3D Gold Coins, 3D Gold Bars, grouped luxury cards, and interactive charts.

---

## 📁 1. Rate Chart Screen (`src/app/(app)/(tabs)/home/ratechart.tsx`)

```tsx
import { useAppTheme } from "@/store/global.store";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    BackHandler,
    Platform,
    Image,
    Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart } from "react-native-chart-kit";
import { Dropdown } from "react-native-element-dropdown";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigation, useRouter, useLocalSearchParams } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

interface RateData {
    id: number;
    gold_rate: string;
    silver_rate: string;
    status: string;
    created_at: string;
    updated_at: string;
    sgst: string | null;
    cgst: string | null;
}

interface RatesResponse {
    data: RateData[];
}

type RateType = "gold" | "silver";
type DateFilter = "all" | "thisWeek" | "thisMonth" | "lastMonth" | "last3Months" | "last6Months";
type TimeframeOption = "thisWeek" | "thisMonth" | "last3Months" | "all";

export default function RateChart() {
    const theme = useAppTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const { t } = useTranslation();
    const navigation = useNavigation();
    const router = useRouter();
    const { from } = useLocalSearchParams();

    const [ratesData, setRatesData] = useState<RateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRateType, setSelectedRateType] = useState<RateType>("gold");
    const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>("thisWeek");
    const [isFocus, setIsFocus] = useState(false);
    const [infoModalVisible, setInfoModalVisible] = useState(false);
    const [selectedPoint, setSelectedPoint] = useState<{
        value: number;
        label: string;
        x: number;
        y: number;
        index: number;
    } | null>(null);

    useEffect(() => {
        if (from === "profile") {
            navigation.setOptions({
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => router.replace("/(app)/(tabs)/profile")}
                        style={{ marginLeft: Platform.OS === "ios" ? 10 : 0, paddingRight: 15 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
                    </TouchableOpacity>
                ),
            });
        }
    }, [from, navigation, router]);

    // Override hardware back press when navigated from profile
    useEffect(() => {
        const handleBackPress = () => {
            if (from === "profile") {
                router.replace("/(app)/(tabs)/profile");
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            handleBackPress
        );

        return () => backHandler.remove();
    }, [from, router]);

    const dateFilterOptions = useMemo(() => [
        { label: t("rateChart_all") || "All Time", value: "all" },
        { label: t("rateChart_thisWeek") || "This Week", value: "thisWeek" },
        { label: t("rateChart_thisMonth") || "This Month", value: "thisMonth" },
        { label: t("rateChart_lastMonth") || "Last Month", value: "lastMonth" },
        { label: t("rateChart_last3Months") || "Last 3 Months", value: "last3Months" },
        { label: t("rateChart_last6Months") || "Last 6 Months", value: "last6Months" },
    ], [t]);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get<RatesResponse>("/rates");
            if (response.data && response.data.data) {
                // Sort by created_at descending (newest first)
                const sortedData = [...response.data.data].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                setRatesData(sortedData);
            }
        } catch (err: any) {
            console.error("Error fetching rates:", err);
            setError(err.response?.data?.message || "Failed to fetch rates");
        } finally {
            setLoading(false);
        }
    };

    // Filter data based on selected date filter
    const filteredData = useMemo(() => {
        if (selectedDateFilter === "all") {
            return ratesData;
        }

        const now = new Date();
        const filterDate = new Date();

        switch (selectedDateFilter) {
            case "thisWeek":
                filterDate.setDate(now.getDate() - 7);
                break;
            case "thisMonth":
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case "lastMonth":
                filterDate.setMonth(now.getMonth() - 2);
                break;
            case "last3Months":
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case "last6Months":
                filterDate.setMonth(now.getMonth() - 6);
                break;
        }

        return ratesData.filter((item) => {
            const itemDate = new Date(item.created_at);
            return itemDate >= filterDate;
        });
    }, [ratesData, selectedDateFilter]);

    // Prepare chart data
    const chartData = useMemo(() => {
        if (filteredData.length === 0) {
            return {
                labels: [],
                datasets: [
                    {
                        data: [],
                    },
                ],
            };
        }

        // Reverse to show oldest to newest (left to right)
        const sortedForChart = [...filteredData].reverse();
        const monthAbbreviations = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

        const labels = sortedForChart.map((item) => {
            const date = new Date(item.created_at);
            const day = String(date.getDate()).padStart(2, "0");
            const month = monthAbbreviations[date.getMonth()];
            return `${day}-${month}`;
        });

        const data = sortedForChart.map((item) => {
            const rate = selectedRateType === "gold"
                ? parseFloat(item.gold_rate)
                : parseFloat(item.silver_rate);
            return rate;
        });

        // Set default tooltip point to latest item if available
        if (data.length > 0 && !selectedPoint) {
            const lastIndex = data.length - 1;
            setSelectedPoint({
                value: data[lastIndex],
                label: labels[lastIndex],
                x: 0,
                y: 0,
                index: lastIndex,
            });
        }

        return {
            labels: labels.length > 7 ? labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0) : labels,
            allLabels: labels,
            datasets: [
                {
                    data,
                    color: () => selectedRateType === "gold" ? "#C58B1B" : "#64748B",
                    strokeWidth: 2.5,
                },
            ],
        };
    }, [filteredData, selectedRateType]);

    const chartConfig = {
        backgroundColor: "#FFFFFF",
        backgroundGradientFrom: "#FFFDF8",
        backgroundGradientTo: "#FFF7E6",
        decimalPlaces: 2,
        color: (opacity = 1) => {
            if (selectedRateType === "gold") {
                return `rgba(197, 139, 27, ${opacity})`;
            } else {
                return `rgba(100, 116, 139, ${opacity})`;
            }
        },
        labelColor: () => "#8C7A6B",
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: selectedRateType === "gold" ? "#C58B1B" : "#64748B",
            fill: "#FFFFFF",
        },
        propsForBackgroundLines: {
            strokeDasharray: "4 4",
            stroke: "#F0E8D9",
            strokeWidth: 1,
        },
    };

    // Get current rate
    const currentRate = useMemo(() => {
        if (filteredData.length === 0) return null;
        const latest = filteredData[0];
        return selectedRateType === "gold"
            ? parseFloat(latest.gold_rate)
            : parseFloat(latest.silver_rate);
    }, [filteredData, selectedRateType]);

    // Get rate change
    const rateChange = useMemo(() => {
        if (filteredData.length < 2) return null;
        const latest = filteredData[0];
        const previous = filteredData[1];
        const latestRate = selectedRateType === "gold"
            ? parseFloat(latest.gold_rate)
            : parseFloat(latest.silver_rate);
        const previousRate = selectedRateType === "gold"
            ? parseFloat(previous.gold_rate)
            : parseFloat(previous.silver_rate);
        return latestRate - previousRate;
    }, [filteredData, selectedRateType]);

    const rateChangePercent = useMemo(() => {
        if (rateChange === null || currentRate === null || currentRate - rateChange === 0) return 0;
        return (rateChange / (currentRate - rateChange)) * 100;
    }, [rateChange, currentRate]);

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#C58B1B" />
                    <Text style={styles.loadingText}>{t("rateChart_loadingRates") || "Loading rates..."}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchRates}>
                        <Text style={styles.retryButtonText}>{t("retry") || "Retry"}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            {/* Top Custom Header */}
            <View style={styles.topHeaderBar}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitleText}>Rate Chart</Text>
                <TouchableOpacity
                    onPress={() => setInfoModalVisible(true)}
                    style={styles.infoButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="information-circle-outline" size={24} color="#1F2937" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Metal Selector (Gold / Silver) */}
                <View style={styles.metalTabSelector}>
                    <TouchableOpacity
                        onPress={() => {
                            setSelectedRateType("gold");
                            setSelectedPoint(null);
                        }}
                        style={[
                            styles.metalTab,
                            selectedRateType === "gold" && styles.metalTabActiveGold,
                        ]}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="cube"
                            size={18}
                            color={selectedRateType === "gold" ? "#FFFFFF" : "#B47C16"}
                            style={{ marginRight: 8 }}
                        />
                        <Text
                            style={[
                                styles.metalTabText,
                                selectedRateType === "gold" && styles.metalTabTextActive,
                            ]}
                        >
                            {t("rateChart_gold") || "Gold"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            setSelectedRateType("silver");
                            setSelectedPoint(null);
                        }}
                        style={[
                            styles.metalTab,
                            selectedRateType === "silver" && styles.metalTabActiveSilver,
                        ]}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="cube-outline"
                            size={18}
                            color={selectedRateType === "silver" ? "#FFFFFF" : "#64748B"}
                            style={{ marginRight: 8 }}
                        />
                        <Text
                            style={[
                                styles.metalTabText,
                                selectedRateType === "silver" && styles.metalTabTextActive,
                            ]}
                        >
                            {t("rateChart_silver") || "Silver"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Hero Current Rate Card */}
                {currentRate !== null && (
                    <View style={styles.heroRateCard}>
                        <View style={styles.heroRateLeft}>
                            <Text style={styles.heroRateSubtitle}>
                                {selectedRateType === "gold" ? "Current Gold Rate" : "Current Silver Rate"}
                            </Text>
                            <Text style={styles.heroRatePrice}>
                                ₹{currentRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            {rateChange !== null && (
                                <View style={styles.heroRateBadge}>
                                    <Ionicons
                                        name={rateChange >= 0 ? "arrow-up" : "arrow-down"}
                                        size={14}
                                        color={rateChange >= 0 ? "#059669" : "#DC2626"}
                                    />
                                    <Text
                                        style={[
                                            styles.heroRateBadgeText,
                                            { color: rateChange >= 0 ? "#059669" : "#DC2626" },
                                        ]}
                                    >
                                        ₹{Math.abs(rateChange).toFixed(2)} ({rateChange >= 0 ? "+" : "-"}
                                        {Math.abs(rateChangePercent).toFixed(2)}%)
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.heroRateRight}>
                            <Image
                                source={
                                    selectedRateType === "gold"
                                        ? require("@assets/images/bar.png")
                                        : require("@assets/images/silver.png")
                                }
                                style={styles.heroRateImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>
                )}

                {/* 3. Filter by Date Dropdown */}
                <View style={styles.filterSection}>
                    <Text style={styles.filterSectionLabel}>Filter by Date</Text>
                    <Dropdown
                        style={[styles.dropdownContainer, isFocus && styles.dropdownContainerFocused]}
                        placeholderStyle={styles.dropdownPlaceholder}
                        selectedTextStyle={styles.dropdownSelectedText}
                        iconStyle={styles.dropdownIconStyle as any}
                        data={dateFilterOptions}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="Select Period"
                        value={selectedDateFilter}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={(item) => {
                            setSelectedDateFilter(item.value as DateFilter);
                            setIsFocus(false);
                            setSelectedPoint(null);
                        }}
                        renderLeftIcon={() => (
                            <Ionicons
                                name="calendar-outline"
                                size={18}
                                color="#C58B1B"
                                style={styles.calendarIcon}
                            />
                        )}
                        renderRightIcon={() => (
                            <Ionicons
                                name="chevron-down"
                                size={18}
                                color="#6B7280"
                            />
                        )}
                    />
                </View>

                {/* 4. Rate Trend Chart Card */}
                {chartData.labels.length > 0 ? (
                    <View style={styles.chartCard}>
                        <View style={styles.chartHeaderRow}>
                            <Text style={styles.chartCardTitle}>
                                {selectedRateType === "gold" ? "Gold Rate Trend" : "Silver Rate Trend"}
                            </Text>
                            <View style={styles.timeframePillsRow}>
                                {[
                                    { label: "This Week", value: "thisWeek" },
                                    { label: "1M", value: "thisMonth" },
                                    { label: "3M", value: "last3Months" },
                                    { label: "1Y", value: "all" },
                                ].map((tf) => {
                                    const isSelected = selectedDateFilter === tf.value;
                                    return (
                                        <TouchableOpacity
                                            key={tf.value}
                                            onPress={() => {
                                                setSelectedDateFilter(tf.value as DateFilter);
                                                setSelectedPoint(null);
                                            }}
                                            style={[
                                                styles.timeframePill,
                                                isSelected && styles.timeframePillActive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.timeframePillText,
                                                    isSelected && styles.timeframePillTextActive,
                                                ]}
                                            >
                                                {tf.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Y-Axis title */}
                        <Text style={styles.yAxisTitle}>Price (₹)</Text>

                        {/* Interactive Tooltip Card Overlay */}
                        {selectedPoint && (
                            <View style={styles.interactiveTooltip}>
                                <Text style={styles.tooltipValue}>
                                    ₹{selectedPoint.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.tooltipLabel}>{selectedPoint.label}</Text>
                            </View>
                        )}

                        <View style={styles.chartCanvasWrapper}>
                            <LineChart
                                data={chartData}
                                width={screenWidth - 56}
                                height={240}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chartStyle}
                                withInnerLines={true}
                                withOuterLines={false}
                                withVerticalLines={false}
                                withHorizontalLines={true}
                                withDots={true}
                                withShadow={false}
                                onDataPointClick={(data) => {
                                    const rawLabels = (chartData as any).allLabels || chartData.labels;
                                    const label = rawLabels[data.index] || "";
                                    setSelectedPoint({
                                        value: data.value,
                                        label,
                                        x: data.x,
                                        y: data.y,
                                        index: data.index,
                                    });
                                }}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.noDataCard}>
                        <Ionicons name="bar-chart-outline" size={48} color="#9CA3AF" />
                        <Text style={styles.noDataText}>{t("rateChart_noDataAvailable") || "No rate data available for this range."}</Text>
                    </View>
                )}

                {/* 5. Footer Records Status */}
                <View style={styles.footerStatusRow}>
                    <View style={styles.recordsBadge}>
                        <Ionicons name="trending-up-outline" size={16} color="#374151" style={{ marginRight: 6 }} />
                        <Text style={styles.recordsBadgeText}>
                            Showing {filteredData.length} record{filteredData.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={fetchRates} style={styles.refreshRow}>
                        <Text style={styles.refreshText}>Updated just now</Text>
                        <Ionicons name="reload" size={14} color="#6B7280" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>

                {/* 6. Rate History Table */}
                {filteredData.length > 0 && (
                    <View style={styles.tableCard}>
                        <Text style={styles.tableCardTitle}>{t("rateChart_rateHistory") || "Rate History"}</Text>
                        <View style={styles.tableHeaderRow}>
                            <Text style={[styles.tableHeaderCell, styles.colDate]}>{t("rateChart_dateHeader") || "Date"}</Text>
                            <Text style={[styles.tableHeaderCell, styles.colRate]}>
                                {selectedRateType === "gold" ? "Gold Rate (₹)" : "Silver Rate (₹)"}
                            </Text>
                            <Text style={[styles.tableHeaderCell, styles.colStatus]}>{t("rateChart_statusHeader") || "Status"}</Text>
                        </View>
                        {filteredData.slice(0, 10).map((item, idx) => {
                            const date = new Date(item.created_at);
                            const rate = selectedRateType === "gold"
                                ? parseFloat(item.gold_rate)
                                : parseFloat(item.silver_rate);
                            return (
                                <View
                                    key={item.id || idx}
                                    style={[
                                        styles.tableBodyRow,
                                        idx % 2 === 1 && { backgroundColor: "#FAF8F5" },
                                    ]}
                                >
                                    <Text style={[styles.tableBodyCell, styles.colDate]}>
                                        {date.toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </Text>
                                    <Text style={[styles.tableBodyCell, styles.colRate, { fontWeight: "700", color: "#1F2937" }]}>
                                        ₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    <View style={[styles.colStatus, { alignItems: "center" }]}>
                                        <View
                                            style={[
                                                styles.statusPill,
                                                item.status === "active"
                                                    ? styles.statusPillActive
                                                    : styles.statusPillInactive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusPillText,
                                                    item.status === "active"
                                                        ? styles.statusPillTextActive
                                                        : styles.statusPillTextInactive,
                                                ]}
                                            >
                                                {item.status === "active" ? "Active" : "Archived"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Info Modal */}
            <Modal
                visible={infoModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setInfoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Rate Chart Information</Text>
                            <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalBodyText}>
                            Gold and Silver rates displayed are live market retail benchmark prices updated daily by Sri Thanga Thamarai.
                        </Text>
                        <Text style={[styles.modalBodyText, { marginTop: 8 }]}>
                            Rates are per gram and subject to applicable GST taxes at the time of purchase or advance booking.
                        </Text>
                        <TouchableOpacity
                            onPress={() => setInfoModalVisible(false)}
                            style={styles.modalCloseBtn}
                        >
                            <Text style={styles.modalCloseBtnText}>Got it</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function getStyles(theme: any) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: "#FBF9F5",
        },
        topHeaderBar: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: "#FBF9F5",
        },
        backButton: {
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
        },
        headerTitleText: {
            fontSize: 20,
            fontWeight: "700",
            color: "#1F2937",
            letterSpacing: 0.2,
        },
        infoButton: {
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingBottom: 40,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
        },
        loadingText: {
            marginTop: 12,
            fontSize: 15,
            color: "#6B7280",
        },
        errorContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
        },
        errorText: {
            marginTop: 16,
            fontSize: 15,
            color: "#DC2626",
            textAlign: "center",
        },
        retryButton: {
            marginTop: 20,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#C58B1B",
            borderRadius: 10,
        },
        retryButtonText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "600",
        },
        // Metal Selector Tabs
        metalTabSelector: {
            flexDirection: "row",
            backgroundColor: "#F1EBE0",
            borderRadius: 14,
            padding: 4,
            marginBottom: 16,
        },
        metalTab: {
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 10,
            borderRadius: 10,
        },
        metalTabActiveGold: {
            backgroundColor: "#C58B1B",
            shadowColor: "#C58B1B",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
        },
        metalTabActiveSilver: {
            backgroundColor: "#64748B",
            shadowColor: "#64748B",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
        },
        metalTabText: {
            fontSize: 15,
            fontWeight: "700",
            color: "#6B7280",
        },
        metalTabTextActive: {
            color: "#FFFFFF",
        },
        // Hero Rate Card
        heroRateCard: {
            flexDirection: "row",
            backgroundColor: "#FFFBF2",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#F3E5C8",
            padding: 20,
            marginBottom: 20,
            alignItems: "center",
            justifyContent: "space-between",
            shadowColor: "#C58B1B",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
        },
        heroRateLeft: {
            flex: 1,
        },
        heroRateSubtitle: {
            fontSize: 13,
            fontWeight: "600",
            color: "#6B7280",
            marginBottom: 6,
        },
        heroRatePrice: {
            fontSize: 30,
            fontWeight: "800",
            color: "#1F2937",
            letterSpacing: -0.5,
            marginBottom: 8,
        },
        heroRateBadge: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#ECFDF5",
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            alignSelf: "flex-start",
        },
        heroRateBadgeText: {
            fontSize: 13,
            fontWeight: "700",
            marginLeft: 4,
        },
        heroRateRight: {
            width: 100,
            height: 80,
            alignItems: "center",
            justifyContent: "center",
        },
        heroRateImage: {
            width: 95,
            height: 75,
        },
        // Filter Section
        filterSection: {
            marginBottom: 20,
        },
        filterSectionLabel: {
            fontSize: 14,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 8,
        },
        dropdownContainer: {
            height: 48,
            backgroundColor: "#FFFFFF",
            borderColor: "#E5E7EB",
            borderWidth: 1,
            borderRadius: 12,
            paddingHorizontal: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1,
        },
        dropdownContainerFocused: {
            borderColor: "#C58B1B",
            borderWidth: 1.5,
        },
        dropdownPlaceholder: {
            fontSize: 14,
            color: "#9CA3AF",
        },
        dropdownSelectedText: {
            fontSize: 14,
            fontWeight: "600",
            color: "#1F2937",
        },
        dropdownIconStyle: {
            width: 18,
            height: 18,
        },
        calendarIcon: {
            marginRight: 10,
        },
        // Chart Card
        chartCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            borderWidth: 1,
            borderColor: "#F3EFE6",
            padding: 16,
            marginBottom: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
            position: "relative",
        },
        chartHeaderRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
        },
        chartCardTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: "#1F2937",
        },
        timeframePillsRow: {
            flexDirection: "row",
            backgroundColor: "#F4EFE6",
            borderRadius: 10,
            padding: 2,
            gap: 2,
        },
        timeframePill: {
            paddingVertical: 5,
            paddingHorizontal: 8,
            borderRadius: 8,
        },
        timeframePillActive: {
            backgroundColor: "#C58B1B",
        },
        timeframePillText: {
            fontSize: 11,
            fontWeight: "700",
            color: "#6B7280",
        },
        timeframePillTextActive: {
            color: "#FFFFFF",
        },
        yAxisTitle: {
            fontSize: 11,
            fontWeight: "600",
            color: "#9CA3AF",
            marginBottom: 4,
        },
        interactiveTooltip: {
            position: "absolute",
            top: 55,
            right: 24,
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            paddingVertical: 6,
            paddingHorizontal: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
            alignItems: "center",
            zIndex: 10,
        },
        tooltipValue: {
            fontSize: 13,
            fontWeight: "800",
            color: "#1F2937",
        },
        tooltipLabel: {
            fontSize: 10,
            fontWeight: "600",
            color: "#6B7280",
            marginTop: 2,
        },
        chartCanvasWrapper: {
            alignItems: "center",
            marginLeft: -10,
        },
        chartStyle: {
            borderRadius: 16,
            paddingRight: 10,
        } as any,
        noDataCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#F3EFE6",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
            marginBottom: 20,
        },
        noDataText: {
            marginTop: 10,
            fontSize: 14,
            color: "#9CA3AF",
            textAlign: "center",
        },
        // Footer Status
        footerStatusRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
        },
        recordsBadge: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#F3EFE6",
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 10,
        },
        recordsBadgeText: {
            fontSize: 12,
            fontWeight: "700",
            color: "#374151",
        },
        refreshRow: {
            flexDirection: "row",
            alignItems: "center",
        },
        refreshText: {
            fontSize: 12,
            color: "#6B7280",
            fontWeight: "500",
        },
        // Table Card
        tableCard: {
            backgroundColor: "#FFFFFF",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#F3EFE6",
            padding: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        tableCardTitle: {
            fontSize: 15,
            fontWeight: "700",
            color: "#1F2937",
            marginBottom: 14,
        },
        tableHeaderRow: {
            flexDirection: "row",
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F3EFE6",
            marginBottom: 4,
        },
        tableHeaderCell: {
            fontSize: 12,
            fontWeight: "700",
            color: "#9CA3AF",
        },
        colDate: {
            flex: 2,
        },
        colRate: {
            flex: 2,
            textAlign: "right",
        },
        colStatus: {
            flex: 1.5,
            textAlign: "center",
        },
        tableBodyRow: {
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F8F6F0",
        },
        tableBodyCell: {
            fontSize: 13,
            color: "#374151",
        },
        statusPill: {
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 8,
        },
        statusPillActive: {
            backgroundColor: "#ECFDF5",
        },
        statusPillInactive: {
            backgroundColor: "#F3F4F6",
        },
        statusPillText: {
            fontSize: 11,
            fontWeight: "700",
        },
        statusPillTextActive: {
            color: "#059669",
        },
        statusPillTextInactive: {
            color: "#9CA3AF",
        },
        // Modal
        modalOverlay: {
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
        },
        modalCard: {
            width: "100%",
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            padding: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 8,
        },
        modalHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
        },
        modalTitle: {
            fontSize: 17,
            fontWeight: "700",
            color: "#1F2937",
        },
        modalBodyText: {
            fontSize: 14,
            color: "#4B5563",
            lineHeight: 20,
        },
        modalCloseBtn: {
            marginTop: 20,
            backgroundColor: "#C58B1B",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
        },
        modalCloseBtnText: {
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "700",
        },
    });
}
```

---

## 📁 2. Schemes Screen (`src/app/(app)/(tabs)/home/schemes.tsx`)

```tsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Animated,
  Platform,
  Image,
  RefreshControl,
  ScrollView,
  Alert,
  Modal,
  Linking,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import useGlobalStore, { useAppTheme } from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { useAppVisibility } from "@/hooks/useAppVisibility";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@/utils/logger";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

interface Chit {
  CHITID: number | null | undefined;
  AMOUNT: string | null | undefined;
  NOINS?: number | null | undefined;
  TOTALMEMBERS?: number | null | undefined;
  PAYMENT_FREQUENCY?: string | null | undefined;
  ACTIVE?: string | null | undefined;
  PAYMENT_FREQUENCY_ID?: string | null | undefined;
}

interface TableMeta {
  rows?: Array<Record<string, any>> | null | undefined;
  headers?:
  | {
    en?: string[] | null | undefined;
    ta?: string[] | null | undefined;
  }
  | null
  | undefined;
}

interface Scheme {
  SCHEMEID: number | null | undefined;
  SCHEMENAME: { en: string; ta?: string } | string | null | undefined;
  DESCRIPTION: { en: string; ta?: string } | string | null | undefined;
  BENEFITS?: string[] | null | undefined;
  SCHEMETYPE: string | null | undefined;
  savingType?: string | null | undefined;
  SLOGAN?: { en: string; ta?: string } | string | null | undefined;
  IMAGE?: string | null | undefined;
  ICON?: string | null | undefined;
  DURATION_MONTHS?: number | null | undefined;
  FIXED?: string | null | undefined;
  ACTIVE: string | null | undefined;
  SCHEMENO?: string | null | undefined;
  REGNO?: string | null | undefined;
  BRANCHID?: string | null | undefined;
  INS_TYPE?: string | null | undefined;
  meta_data?: Array<{ table_meta?: TableMeta }> | null | undefined;
  table_meta?: TableMeta | null | undefined;
  chits: Chit[] | null | undefined;
  branch?: Array<any> | null | undefined;
  relevantChits?: Array<{ CHITID: number; AMOUNT: number }> | null | undefined;
  instant_intrest?: boolean | null | undefined;
  scheme_plan_type_id?: number | null | undefined;
  SCHEME_PLAN_TYPE_ID?: number | null | undefined;
}

const isValidScheme = (scheme: any): scheme is Scheme => {
  return (
    scheme !== null &&
    scheme !== undefined &&
    typeof scheme === "object" &&
    (scheme.SCHEMEID !== undefined || scheme.SCHEMENAME !== undefined)
  );
};

const isValidString = (value: any): value is string => {
  return typeof value === "string" && value.trim() !== "";
};

const isValidArray = (value: any): value is any[] => {
  return Array.isArray(value) && value.length > 0;
};

const getTranslatedText = (
  textObj: any,
  language: string
): string => {
  if (textObj === null || textObj === undefined || textObj === "") {
    return "";
  }

  if (typeof textObj === "string") {
    return textObj.trim() || "";
  }

  if (typeof textObj === "number") {
    return isNaN(textObj) ? "" : String(textObj);
  }

  if (typeof textObj === "boolean") {
    return String(textObj);
  }

  if (typeof textObj === "object" && textObj !== null) {
    if (Array.isArray(textObj)) {
      const validItems = textObj.filter(
        (item) => item !== null && item !== undefined && item !== ""
      );
      return validItems.length > 0 ? validItems.join(", ") : "";
    }

    const hasEn = textObj.hasOwnProperty("en") || textObj.hasOwnProperty("EN");
    const hasTa = textObj.hasOwnProperty("ta") || textObj.hasOwnProperty("TA");
    const hasTe = textObj.hasOwnProperty("te") || textObj.hasOwnProperty("TE");
    const hasHi = textObj.hasOwnProperty("hi") || textObj.hasOwnProperty("HI");
    const hasMal = textObj.hasOwnProperty("mal") || textObj.hasOwnProperty("MAL") || (textObj as any).hasOwnProperty("_ta") || (textObj as any).hasOwnProperty("_TA");

    if (hasEn || hasTa || hasTe || hasHi || hasMal) {
      const targetText = textObj[language] || textObj[language.toUpperCase()] || textObj[language.toLowerCase()];
      const enText = textObj.en || textObj.EN || "";
      const taText = textObj.ta || textObj.TA || "";

      if ((language === "mal" || language === "MAL") && !targetText) {
        const malTextLegacy = (textObj as any)._ta || (textObj as any)._TA || "";
        return malTextLegacy || taText || enText || Object.values(textObj)[0] || "";
      }

      return targetText || enText || taText || Object.values(textObj)[0] || "";
    }

    try {
      const stringified = JSON.stringify(textObj);
      return stringified === "{}" || stringified === "[]" ? "" : stringified;
    } catch {
      return "";
    }
  }

  try {
    return String(textObj);
  } catch {
    return "";
  }
};

export default function SchemeList({ isNested = false }: { isNested?: boolean }) {
  const { isVisible } = useAppVisibility();
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const params = useLocalSearchParams<{ schemeId?: string; schemeType?: string; mode?: string; type?: string; category?: string }>();
  const { schemeId, schemeType, mode } = params;

  // Selected Category filter: "all", "gold", "monthly", "hybrid", "flexi", "silver"
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [allSchemes, setAllSchemes] = useState<Scheme[]>([]);
  const [joiningScheme, setJoiningScheme] = useState<number | null>(null);
  const router = useRouter();
  const { language } = useGlobalStore();
  const { t } = useTranslation();

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<any[]>([]);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAllSchemes = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const { fetchSchemesWithCache } = await import("@/utils/apiCache");
        const schemesData = await fetchSchemesWithCache();

        if (isMounted) {
          if (schemesData && isValidArray(schemesData)) {
            const validSchemes = schemesData.filter(isValidScheme);
            setAllSchemes(validSchemes.length > 0 ? validSchemes : []);
          } else {
            setAllSchemes([]);
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.error("Error fetching schemes:", error);
          Alert.alert(t("schemes.error") || "Error", t("schemes.failedToFetchSchemes") || "Failed to load schemes");
          setAllSchemes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAllSchemes();
    return () => {
      isMounted = false;
    };
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { fetchSchemesWithCache } = await import("@/utils/apiCache");
      const schemesData = await fetchSchemesWithCache();

      if (schemesData && isValidArray(schemesData)) {
        const validSchemes = schemesData.filter(isValidScheme);
        setAllSchemes(validSchemes);
      }
    } catch (error) {
      logger.error("Error refreshing schemes:", error);
      Alert.alert(t("schemes.error") || "Error", t("schemes.failedToFetchSchemes") || "Failed to refresh schemes");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleJoinScheme = async (item: Scheme) => {
    const schemeId = item.SCHEMEID || 0;
    setJoiningScheme(schemeId);

    try {
      const chits = item.chits || [];
      const schemeTypeLower = (item.SCHEMETYPE || "Monthly").toLowerCase();

      const schemeDataToStore = {
        schemeId: schemeId,
        name: getTranslatedText(item.SCHEMENAME, language) || "Savings Scheme",
        description: getTranslatedText(item.DESCRIPTION as any, language) || "",
        type: item.SCHEMETYPE || "Monthly",
        chits: chits,
        schemeType: schemeTypeLower.includes("flexi") ? "flexi" : "fixed",
        activeTab: item.SCHEMETYPE || "Monthly",
        benefits: item.BENEFITS || [],
        slogan: getTranslatedText(item.SLOGAN || { en: "" }, language) || "",
        image: item.IMAGE || "",
        icon: item.ICON || "",
        durationMonths: item.DURATION_MONTHS || 11,
        metaData: item.table_meta || item.meta_data || null,
        instant_intrest: item.instant_intrest || false,
        timestamp: new Date().toISOString(),
        savingType: item.savingType || (schemeTypeLower === "weight" ? "weight" : "amount"),
      };

      await AsyncStorage.setItem(
        "@current_scheme_data",
        JSON.stringify(schemeDataToStore)
      );

      router.push({
        pathname: "/home/join_savings",
        params: {
          schemeId: schemeId.toString(),
        },
      });
    } catch (error) {
      logger.error("Error storing scheme data:", error);
      Alert.alert(t("schemes.error") || "Error", t("schemes.failedToLoadSchemeData") || "Failed to proceed to join");
    } finally {
      setJoiningScheme(null);
    }
  };

  const showDetailModal = useCallback((scheme: Scheme) => {
    setSelectedScheme(scheme);
    setIsDetailModalVisible(true);
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const closeDetailModal = useCallback(() => {
    setIsDetailModalVisible(false);
    setSelectedScheme(null);
  }, []);

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to extract scheme minimum/display amount
  const getSchemeDisplayAmount = (item: Scheme) => {
    if (!item.chits || item.chits.length === 0) return 5000;
    const amounts = item.chits
      .map((c) => parseFloat(c.AMOUNT || "0"))
      .filter((a) => a > 0);
    return amounts.length > 0 ? Math.min(...amounts) : 5000;
  };

  // Grouping schemes into sections (Flexi, Hybrid, Monthly, etc.)
  const groupedSections = useMemo(() => {
    if (!allSchemes || allSchemes.length === 0) return [];

    const activeSchemes = allSchemes.filter((s) => s.ACTIVE === "Y");

    // Filter by selectedCategory pill
    const filtered = activeSchemes.filter((scheme) => {
      if (selectedCategory === "all") return true;

      const nameLower = (getTranslatedText(scheme.SCHEMENAME, "en") || "").toLowerCase();
      const typeLower = (scheme.SCHEMETYPE || "").toLowerCase();
      const insLower = (scheme.INS_TYPE || "").toLowerCase();
      const combined = `${nameLower} ${typeLower} ${insLower}`;

      if (selectedCategory === "gold") {
        return !combined.includes("silver") && !combined.includes("diamond") && !combined.includes("platinum");
      }
      if (selectedCategory === "monthly") {
        return typeLower.includes("monthly") || (!typeLower.includes("flexi") && !typeLower.includes("hybrid"));
      }
      if (selectedCategory === "hybrid") {
        return typeLower.includes("hybrid") || scheme.scheme_plan_type_id === 3 || scheme.SCHEME_PLAN_TYPE_ID === 3;
      }
      if (selectedCategory === "flexi") {
        return typeLower.includes("flexi") || typeLower.includes("flexible");
      }
      if (selectedCategory === "silver") {
        return combined.includes("silver") || combined.includes("வெள்ளி");
      }
      return true;
    });

    // Grouping by Scheme Type
    const groups: { [key: string]: Scheme[] } = {};

    filtered.forEach((scheme) => {
      const typeLower = (scheme.SCHEMETYPE || "Monthly").toLowerCase();
      let sectionKey = "Monthly Schemes";

      if (typeLower.includes("flexi") || typeLower.includes("flexible")) {
        sectionKey = "Flexi Schemes";
      } else if (typeLower.includes("hybrid") || scheme.scheme_plan_type_id === 3 || scheme.SCHEME_PLAN_TYPE_ID === 3) {
        sectionKey = "Hybrid Schemes";
      } else if (typeLower.includes("daily")) {
        sectionKey = "Daily Schemes";
      } else if (typeLower.includes("weekly")) {
        sectionKey = "Weekly Schemes";
      } else {
        sectionKey = "Monthly Schemes";
      }

      if (!groups[sectionKey]) {
        groups[sectionKey] = [];
      }
      groups[sectionKey].push(scheme);
    });

    // Build ordered list
    const order = ["Flexi Schemes", "Hybrid Schemes", "Monthly Schemes", "Daily Schemes", "Weekly Schemes"];
    const resultList: Array<{ type: "header" | "card"; sectionTitle?: string; count?: number; item?: Scheme; id: string }> = [];

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
      const idxA = order.indexOf(a);
      const idxB = order.indexOf(b);
      return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
    });

    sortedGroupKeys.forEach((groupKey) => {
      const items = groups[groupKey];
      if (items.length > 0) {
        resultList.push({
          type: "header",
          sectionTitle: groupKey,
          count: items.length,
          id: `sec-header-${groupKey}`,
        });

        items.forEach((scheme, index) => {
          resultList.push({
            type: "card",
            item: scheme,
            id: `sec-item-${groupKey}-${scheme.SCHEMEID || index}`,
          });
        });
      }
    });

    return resultList;
  }, [allSchemes, selectedCategory, language]);

  const renderFilterPill = (id: string, label: string, iconName: string, activeBg = "#C58B1B") => {
    const isSelected = selectedCategory === id;
    return (
      <TouchableOpacity
        key={id}
        onPress={() => {
          setSelectedCategory(id);
          if (Platform.OS === "ios") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={[
          styles.filterPill,
          isSelected && { backgroundColor: activeBg, borderColor: activeBg },
        ]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={iconName as any}
          size={16}
          color={isSelected ? "#FFFFFF" : "#C58B1B"}
          style={{ marginRight: 6 }}
        />
        <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, count: number) => {
    return (
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          <Text style={styles.sectionHeaderSubtitle}>
            {count} plan{count !== 1 ? "s" : ""} available
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            if (title.includes("Flexi")) setSelectedCategory("flexi");
            else if (title.includes("Hybrid")) setSelectedCategory("hybrid");
            else if (title.includes("Monthly")) setSelectedCategory("monthly");
          }}
          style={styles.viewAllBtn}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="arrow-forward" size={14} color="#C58B1B" style={{ marginLeft: 3 }} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLuxurySchemeCard = (item: Scheme) => {
    const schemeName = (getTranslatedText(item.SCHEMENAME, language) || "Gold Savings").toUpperCase();
    const slogan = getTranslatedText(item.SLOGAN || item.DESCRIPTION as any, language) || "Save monthly. Grow your gold savings.";
    const duration = item.DURATION_MONTHS || 11;
    const amount = getSchemeDisplayAmount(item);
    const type = item.SCHEMETYPE || "Monthly";

    return (
      <TouchableOpacity
        onPress={() => showDetailModal(item)}
        activeOpacity={0.92}
        style={styles.luxuryCard}
      >
        <View style={styles.luxuryCardInner}>
          {/* Left Column Content */}
          <View style={styles.cardLeftCol}>
            <Text style={styles.cardSchemeTitle} numberOfLines={1}>
              {schemeName}
            </Text>
            <Text style={styles.cardSloganText} numberOfLines={2}>
              {slogan}
            </Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.badgePill}>
                <Ionicons name="sparkles" size={12} color="#C58B1B" style={{ marginRight: 4 }} />
                <Text style={styles.badgePillText}>Gold</Text>
              </View>
              <View style={styles.badgePill}>
                <Ionicons name="calendar-outline" size={12} color="#C58B1B" style={{ marginRight: 4 }} />
                <Text style={styles.badgePillText}>{duration} Months</Text>
              </View>
              <View style={styles.badgePill}>
                <Ionicons name="time-outline" size={12} color="#C58B1B" style={{ marginRight: 4 }} />
                <Text style={styles.badgePillText}>{type}</Text>
              </View>
            </View>

            {/* Price & Maturity */}
            <View style={styles.priceRow}>
              <Ionicons name="cash-outline" size={16} color="#C58B1B" style={{ marginRight: 6 }} />
              <Text style={styles.priceValue}>{formatAmount(amount)}</Text>
              <Text style={styles.pricePeriod}> / Month</Text>
            </View>

            <View style={styles.maturityRow}>
              <Ionicons name="time-outline" size={13} color="#8C7A6B" style={{ marginRight: 4 }} />
              <Text style={styles.maturityText}>Maturity: {duration} Months</Text>
            </View>
          </View>

          {/* Right Column: 3D Lotus Gold Coin with Mandala watermark */}
          <View style={styles.cardRightCol}>
            <Image
              source={require("@assets/images/luxury_gold_coin.png")}
              style={styles.mandalaPattern}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Card Footer: View Details Action */}
        <View style={styles.cardFooterDivider} />
        <View style={styles.cardFooterAction}>
          <Text style={styles.viewDetailsText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color="#C58B1B" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF7F2" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* 1. Header with Subtle Jewelry Watermark */}
      {!isNested && (
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerContainer}>
            <Image
              source={require("@assets/images/jewelry_pattern.png")}
              style={styles.headerWatermark}
              resizeMode="contain"
            />
            <View style={styles.headerTopRow}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerMainTitle}>{t("schemes.title") || "Schemes"}</Text>
            <Text style={styles.headerMainSubtitle}>
              Choose a savings plan that suits you
            </Text>
          </View>
        </SafeAreaView>
      )}

      {/* 2. Filter Pills Bar */}
      <View style={styles.filterPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {renderFilterPill("all", "All", "grid")}
          {renderFilterPill("gold", "Gold", "sparkles")}
          {renderFilterPill("monthly", "Monthly", "calendar")}
          {renderFilterPill("hybrid", "Hybrid", "swap-horizontal")}
          {renderFilterPill("flexi", "Flexi", "options")}
        </ScrollView>
      </View>

      {/* 3. Main Scheme Listing (Grouped Sections) */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C58B1B" />
            <Text style={styles.loadingText}>Loading savings plans...</Text>
          </View>
        ) : groupedSections.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Plans Available</Text>
            <Text style={styles.emptySubtitle}>
              Try selecting another category or check back later.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedSections}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
            onScroll={(e) => {
              const offsetY = e.nativeEvent.contentOffset.y;
              setShowScrollTop(offsetY > 200);
            }}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#C58B1B"]}
                tintColor="#C58B1B"
              />
            }
            renderItem={({ item }) => {
              if (item.type === "header") {
                return renderSectionHeader(item.sectionTitle || "", item.count || 0);
              }
              if (item.type === "card" && item.item) {
                return renderLuxurySchemeCard(item.item);
              }
              return null;
            }}
          />
        )}
      </View>

      {/* 4. Floating Action Button (Scroll to Top) */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopFab}
          onPress={() => {
            flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* 5. Scheme Detail & Joining Modal */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetailModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentModern}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSchemeName} numberOfLines={2}>
                {(getTranslatedText(selectedScheme?.SCHEMENAME, language) || "Scheme Details").toUpperCase()}
              </Text>
              <TouchableOpacity
                onPress={closeDetailModal}
                style={styles.modalCloseCircle}
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedScheme && (
                <>
                  <View style={styles.modalHeroBadgeRow}>
                    <View style={styles.modalBadge}>
                      <Ionicons name="time-outline" size={14} color="#C58B1B" style={{ marginRight: 4 }} />
                      <Text style={styles.modalBadgeText}>
                        {selectedScheme.DURATION_MONTHS || 11} {t("schemes.months") || "Months"}
                      </Text>
                    </View>
                    <View style={styles.modalBadge}>
                      <Ionicons name="calendar-outline" size={14} color="#C58B1B" style={{ marginRight: 4 }} />
                      <Text style={styles.modalBadgeText}>{selectedScheme.SCHEMETYPE || "Monthly"}</Text>
                    </View>
                  </View>

                  {selectedScheme.SLOGAN && (
                    <Text style={styles.modalSloganText}>
                      "{getTranslatedText(selectedScheme.SLOGAN as any, language)}"
                    </Text>
                  )}

                  {/* Benefits */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>{t("benefits") || "Key Benefits"}</Text>
                    {(selectedScheme.BENEFITS || ["Secure Monthly Gold Accumulation", "Zero Making Charges on Maturity", "Instant Digital Passbook Tracking"]).map((benefit, idx) => (
                      <View key={idx} style={styles.benefitItemRow}>
                        <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={styles.benefitItemText}>{getTranslatedText(benefit, language)}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Description */}
                  {selectedScheme.DESCRIPTION && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>{t("description") || "About Plan"}</Text>
                      <Text style={styles.modalDescText}>
                        {getTranslatedText(selectedScheme.DESCRIPTION as any, language)}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/* Modal Bottom CTA */}
            <View style={styles.modalBottomCta}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedScheme) {
                    closeDetailModal();
                    if (selectedScheme.SCHEME_PLAN_TYPE_ID === 4) {
                      setSelectedBranches(selectedScheme.branch || []);
                      setBranchModalVisible(true);
                    } else {
                      handleJoinScheme(selectedScheme);
                    }
                  }
                }}
                style={styles.joinNowButton}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#D4AF37", "#B8860B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.joinNowGradient}
                >
                  <Text style={styles.joinNowText}>
                    {selectedScheme?.SCHEME_PLAN_TYPE_ID === 4
                      ? (language === "ta" ? "விசாரிக்க / கிளைக்குச் செல்ல" : "Visit Branch / Enquiry")
                      : (t("joinNow") || "Join Plan Now")}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. Branch Details Modal */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentModern}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalSchemeName}>Branch Enquiry</Text>
              <TouchableOpacity
                onPress={() => setBranchModalVisible(false)}
                style={styles.modalCloseCircle}
              >
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {selectedBranches && selectedBranches.length > 0 ? (
                selectedBranches.map((branch, idx) => (
                  <View key={idx} style={styles.branchItemCard}>
                    <Text style={styles.branchTitle}>{branch.branchName || "Main Branch"}</Text>
                    <Text style={styles.branchAddress}>{branch.branchAddress}, {branch.branchCity}</Text>
                    {branch.branchPhone && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${branch.branchPhone}`)}
                        style={styles.branchCallBtn}
                      >
                        <Ionicons name="call" size={16} color="#FFFFFF" />
                        <Text style={styles.branchCallBtnText}>{branch.branchPhone}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubtitle}>No branches listed for this scheme.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FAF7F2",
    },
    headerSafeArea: {
      backgroundColor: "#FAF7F2",
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 16,
      backgroundColor: "#FAF7F2",
      position: "relative",
      overflow: "hidden",
    },
    headerWatermark: {
      position: "absolute",
      top: -10,
      right: -20,
      width: 140,
      height: 140,
      opacity: 0.18,
    },
    headerTopRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerMainTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: "#1F2937",
      letterSpacing: 0.2,
    },
    headerMainSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      color: "#6B7280",
      marginTop: 2,
    },
    // Filter Pills Bar
    filterPillsContainer: {
      backgroundColor: "#FAF7F2",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#F3EFE6",
    },
    filterPillsScroll: {
      paddingHorizontal: 16,
      gap: 10,
    },
    filterPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "#EAE3D2",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
      elevation: 1,
    },
    filterPillText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#374151",
    },
    filterPillTextActive: {
      color: "#FFFFFF",
    },
    // Content Container
    contentContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },
    listContentContainer: {
      paddingTop: 12,
      paddingBottom: 80,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: "#6B7280",
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#374151",
      marginTop: 14,
    },
    emptySubtitle: {
      fontSize: 13,
      color: "#6B7280",
      textAlign: "center",
      marginTop: 6,
    },
    // Section Header
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    sectionHeaderTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1F2937",
    },
    sectionHeaderSubtitle: {
      fontSize: 12,
      color: "#6B7280",
      marginTop: 1,
    },
    viewAllBtn: {
      flexDirection: "row",
      alignItems: "center",
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#C58B1B",
    },
    // Luxury Scheme Card
    luxuryCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: 20,
      borderWidth: 1.2,
      borderColor: "#F0DCB0",
      padding: 16,
      marginBottom: 18,
      shadowColor: "#C58B1B",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    luxuryCardInner: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    cardLeftCol: {
      flex: 1,
      paddingRight: 10,
    },
    cardSchemeTitle: {
      fontSize: 19,
      fontWeight: "800",
      color: "#A16207",
      letterSpacing: 0.5,
    },
    cardSloganText: {
      fontSize: 12,
      color: "#4B5563",
      marginTop: 4,
      marginBottom: 10,
      lineHeight: 16,
    },
    badgesRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginBottom: 12,
    },
    badgePill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFBEB",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FDE68A",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgePillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#92400E",
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    priceValue: {
      fontSize: 20,
      fontWeight: "800",
      color: "#1F2937",
    },
    pricePeriod: {
      fontSize: 13,
      fontWeight: "600",
      color: "#6B7280",
    },
    maturityRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    maturityText: {
      fontSize: 12,
      fontWeight: "500",
      color: "#8C7A6B",
    },
    cardRightCol: {
      width: 90,
      alignItems: "center",
      justifyContent: "center",
    },
    mandalaPattern: {
      width: 85,
      height: 85,
    },
    cardFooterDivider: {
      height: 1,
      backgroundColor: "#F6EEDD",
      marginVertical: 12,
    },
    cardFooterAction: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    viewDetailsText: {
      fontSize: 13,
      fontWeight: "700",
      color: "#C58B1B",
    },
    // Scroll to top FAB
    scrollTopFab: {
      position: "absolute",
      bottom: 24,
      right: 20,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: "#C58B1B",
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 6,
      zIndex: 100,
    },
    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContentModern: {
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: height * 0.82,
      paddingTop: 16,
      paddingBottom: 24,
    },
    modalHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: "#F3EFE6",
    },
    modalSchemeName: {
      fontSize: 17,
      fontWeight: "800",
      color: "#1F2937",
      flex: 1,
      marginRight: 10,
    },
    modalCloseCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    modalScroll: {
      paddingHorizontal: 20,
    },
    modalScrollContent: {
      paddingVertical: 16,
    },
    modalHeroBadgeRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 14,
    },
    modalBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFBEB",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "#FDE68A",
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    modalBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#92400E",
    },
    modalSloganText: {
      fontSize: 14,
      fontStyle: "italic",
      color: "#4B5563",
      marginBottom: 16,
      lineHeight: 20,
    },
    modalSection: {
      marginBottom: 18,
    },
    modalSectionTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 10,
    },
    benefitItemRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    benefitItemText: {
      fontSize: 13,
      color: "#374151",
      lineHeight: 18,
      flex: 1,
    },
    modalDescText: {
      fontSize: 13,
      color: "#4B5563",
      lineHeight: 19,
    },
    modalBottomCta: {
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#F3EFE6",
    },
    joinNowButton: {
      borderRadius: 14,
      overflow: "hidden",
    },
    joinNowGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
    },
    joinNowText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#FFFFFF",
    },
    branchItemCard: {
      backgroundColor: "#F9FAFB",
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    branchTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: 4,
    },
    branchAddress: {
      fontSize: 13,
      color: "#6B7280",
      marginBottom: 10,
    },
    branchCallBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#C58B1B",
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    branchCallBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
```

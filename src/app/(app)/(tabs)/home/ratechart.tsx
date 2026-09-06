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
        navigation.setOptions({
            headerTitle: t("rateChart") || "Rate Chart",
            headerRight: () => (
                <TouchableOpacity
                    onPress={() => setInfoModalVisible(true)}
                    style={{ marginRight: Platform.OS === "ios" ? 10 : 15, padding: 4 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="information-circle-outline"
                        size={24}
                        color={theme.colors.textDark || "#1F2937"}
                    />
                </TouchableOpacity>
            ),
            headerLeft: from === "profile" ? () => (
                <TouchableOpacity
                    onPress={() => router.replace("/(app)/(tabs)/profile")}
                    style={{ marginLeft: Platform.OS === "ios" ? 10 : 0, paddingRight: 15 }}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textDark || "#1F2937"} />
                </TouchableOpacity>
            ) : undefined,
        });
    }, [from, navigation, router, theme, t]);

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
        decimalPlaces: selectedRateType === "gold" ? 0 : 2,
        color: (opacity = 1) => {
            if (selectedRateType === "gold") {
                return `rgba(197, 139, 27, ${opacity})`;
            } else {
                return `rgba(100, 116, 139, ${opacity})`;
            }
        },
        labelColor: () => "#6B7280",
        propsForLabels: {
            fontSize: 10,
            fontWeight: "600" as any,
        },
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
                                        ? require("../../../../../assets/images/bar.png")
                                        : require("../../../../../assets/images/silver.png")
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
                                width={screenWidth - 64}
                                height={240}
                                chartConfig={chartConfig}
                                yAxisLabel="₹"
                                yLabelsOffset={8}
                                formatYLabel={(val) => Math.round(Number(val)).toString()}
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
                            <Text style={styles.modalTitle}>{t("rateChartInfo") || "Rate Chart Information"}</Text>
                            <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalBodyText}>
                            Gold and Silver rates displayed are live market benchmark prices updated daily by Sri Thanga Thamarai.
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
            justifyContent: "center",
            width: "100%",
        },
        chartStyle: {
            borderRadius: 16,
            paddingRight: 56,
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

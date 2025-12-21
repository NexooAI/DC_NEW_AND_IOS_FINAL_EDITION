import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, } from "react-native-chart-kit";
import { Dropdown } from "react-native-element-dropdown";
import api from "@/services/api";
import { theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";

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

export default function RateChart() {
    const { t } = useTranslation();
    const [ratesData, setRatesData] = useState<RateData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRateType, setSelectedRateType] = useState<RateType>("gold");
    const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilter>("thisWeek");
    const [isFocus, setIsFocus] = useState(false);

    const dateFilterOptions = useMemo(() => [
        { label: t("rateChart_all"), value: "all" },
        { label: t("rateChart_thisWeek"), value: "thisWeek" },
        { label: t("rateChart_thisMonth"), value: "thisMonth" },
        { label: t("rateChart_lastMonth"), value: "lastMonth" },
        { label: t("rateChart_last3Months"), value: "last3Months" },
        { label: t("rateChart_last6Months"), value: "last6Months" },
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

        const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const labels = sortedForChart.map((item) => {
            const date = new Date(item.created_at);
            const day = date.getDate();
            const month = monthAbbreviations[date.getMonth()];
            return `${day}-${month}`;
        });

        const data = sortedForChart.map((item) => {
            const rate = selectedRateType === "gold"
                ? parseFloat(item.gold_rate)
                : parseFloat(item.silver_rate);
            return rate;
        });

        return {
            labels: labels.length > 10 ? labels.filter((_, i) => i % Math.ceil(labels.length / 10) === 0) : labels,
            datasets: [
                {
                    data,
                },
            ],
        };
    }, [filteredData, selectedRateType]);

    const chartConfig = {
        backgroundColor: theme.colors.background,
        backgroundGradientFrom: theme.colors.background,
        backgroundGradientTo: theme.colors.background,
        decimalPlaces: 2,
        color: (opacity = 1) => {
            if (selectedRateType === "gold") {
                return `rgba(255, 215, 0, ${opacity})`; // Gold color
            } else {
                return `rgba(192, 192, 192, ${opacity})`; // Silver color
            }
        },
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: selectedRateType === "gold" ? "#FFD700" : "#C0C0C0",
        },
        propsForBackgroundLines: {
            strokeDasharray: "", // solid lines
            stroke: theme.colors.borderLight,
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>{t("rateChart_loadingRates")}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchRates}>
                        <Text style={styles.retryButtonText}>{t("retry")}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.headerSection}>

                    {/* Rate Type Toggle */}
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                selectedRateType === "gold" && styles.toggleButtonActive,
                            ]}
                            onPress={() => setSelectedRateType("gold")}
                        >
                            <Ionicons
                                name="diamond"
                                size={20}
                                color={selectedRateType === "gold" ? "#fff" : theme.colors.textGrey}
                            />
                            <Text
                                style={[
                                    styles.toggleButtonText,
                                    selectedRateType === "gold" && styles.toggleButtonTextActive,
                                ]}
                            >
                                {t("rateChart_gold")}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                selectedRateType === "silver" && styles.toggleButtonActive,
                            ]}
                            onPress={() => setSelectedRateType("silver")}
                        >
                            <Ionicons
                                name="diamond-outline"
                                size={20}
                                color={selectedRateType === "silver" ? "#fff" : theme.colors.textGrey}
                            />
                            <Text
                                style={[
                                    styles.toggleButtonText,
                                    selectedRateType === "silver" && styles.toggleButtonTextActive,
                                ]}
                            >
                                {t("rateChart_silver")}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Current Rate Display */}
                    {currentRate !== null && (
                        <View style={styles.currentRateContainer}>
                            <Text style={styles.currentRateLabel}>
                                {t("rateChart_currentRate").replace("{type}", selectedRateType === "gold" ? t("rateChart_gold") : t("rateChart_silver"))}
                            </Text>
                            <Text style={styles.currentRateValue}>
                                ₹{currentRate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                            {rateChange !== null && (
                                <View style={styles.rateChangeContainer}>
                                    <Ionicons
                                        name={rateChange >= 0 ? "arrow-up" : "arrow-down"}
                                        size={16}
                                        color={rateChange >= 0 ? theme.colors.success : theme.colors.error}
                                    />
                                    <Text
                                        style={[
                                            styles.rateChangeText,
                                            {
                                                color: rateChange >= 0 ? theme.colors.success : theme.colors.error,
                                            },
                                        ]}
                                    >
                                        ₹{Math.abs(rateChange).toFixed(2)} ({rateChange >= 0 ? "+" : ""}
                                        {((rateChange / (currentRate - rateChange)) * 100).toFixed(2)}%)
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Date Filter Dropdown */}
                <View style={styles.filterContainer}>
                    <Text style={styles.filterLabel}>{t("rateChart_filterByDate")}</Text>
                    <Dropdown
                        style={[styles.dropdown, isFocus && styles.dropdownFocused]}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        iconStyle={styles.iconStyle as any}
                        data={dateFilterOptions}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={t("rateChart_selectPeriod")}
                        value={selectedDateFilter}
                        onFocus={() => setIsFocus(true)}
                        onBlur={() => setIsFocus(false)}
                        onChange={(item) => {
                            setSelectedDateFilter(item.value as DateFilter);
                            setIsFocus(false);
                        }}
                        renderLeftIcon={() => (
                            <Ionicons
                                name="calendar"
                                size={20}
                                color={isFocus ? theme.colors.primary : theme.colors.textGrey}
                                style={styles.dropdownIcon}
                            />
                        )}
                    />
                </View>

                {/* Chart Section */}
                {chartData.labels.length > 0 ? (
                    <View style={styles.chartContainer}>
                        <Text style={styles.chartTitle}>
                            {t("rateChart_rateTrend").replace("{type}", selectedRateType === "gold" ? t("rateChart_gold") : t("rateChart_silver"))}
                        </Text>
                        <View style={styles.chartWrapper}>
                            <LineChart
                                data={chartData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withInnerLines={true}
                                withOuterLines={true}
                                withVerticalLines={true}
                                withHorizontalLines={true}
                                withDots={true}
                                withShadow={false}
                                withScrollableDot={false}
                            />
                        </View>
                        <Text style={styles.chartNote}>
                            {filteredData.length !== 1
                                ? t("rateChart_showingRecordsPlural").replace("{count}", String(filteredData.length))
                                : t("rateChart_showingRecords").replace("{count}", String(filteredData.length))}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.noDataContainer}>
                        <Ionicons name="bar-chart-outline" size={48} color={theme.colors.textGrey} />
                        <Text style={styles.noDataText}>{t("rateChart_noDataAvailable")}</Text>
                    </View>
                )}

                {/* Data Table */}
                {filteredData.length > 0 && (
                    <View style={styles.tableContainer}>
                        <Text style={styles.tableTitle}>{t("rateChart_rateHistory")}</Text>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, styles.tableDateColumn]}>{t("rateChart_dateHeader")}</Text>
                            <Text style={[styles.tableHeaderText, styles.tableRateColumn]}>
                                {t("rateChart_rateHeader").replace("{type}", selectedRateType === "gold" ? t("rateChart_gold") : t("rateChart_silver"))}
                            </Text>
                            <Text style={[styles.tableHeaderText, styles.tableStatusColumn]}>{t("rateChart_statusHeader")}</Text>
                        </View>
                        {filteredData.slice(0, 10).map((item) => {
                            const date = new Date(item.created_at);
                            const rate = selectedRateType === "gold"
                                ? parseFloat(item.gold_rate)
                                : parseFloat(item.silver_rate);
                            return (
                                <View key={item.id} style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.tableDateColumn]}>
                                        {date.toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.tableRateColumn]}>
                                        ₹{rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Text>
                                    <View style={styles.tableStatusCell}>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                item.status === "active"
                                                    ? styles.statusBadgeActive
                                                    : styles.statusBadgeInactive,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    item.status === "active"
                                                        ? styles.statusTextActive
                                                        : styles.statusTextInactive,
                                                ]}
                                            >
                                                {item.status === "active" ? t("rateChart_statusActive") : t("rateChart_statusInactive")}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.textGrey,
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: theme.colors.error,
        textAlign: "center",
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: theme.colors.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    headerSection: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: theme.colors.textDark,
        marginBottom: 20,
    },
    toggleContainer: {
        flexDirection: "row",
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.textGrey,
    },
    toggleButtonTextActive: {
        color: "#fff",
    },
    currentRateContainer: {
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },
    currentRateLabel: {
        fontSize: 14,
        color: theme.colors.textGrey,
        marginBottom: 8,
    },
    currentRateValue: {
        fontSize: 32,
        fontWeight: "bold",
        color: theme.colors.textDark,
        marginBottom: 8,
    },
    rateChangeContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    rateChangeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    filterContainer: {
        marginBottom: 24,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: theme.colors.textDark,
        marginBottom: 8,
    },
    dropdown: {
        height: 50,
        backgroundColor: theme.colors.background,
        borderColor: theme.colors.borderLight || "#e5e5e5",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    dropdownFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    placeholderStyle: {
        fontSize: 16,
        color: theme.colors.textGrey,
    },
    selectedTextStyle: {
        fontSize: 16,
        color: theme.colors.textDark,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    dropdownIcon: {
        marginRight: 8,
    },
    chartContainer: {
        marginBottom: 24,
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: theme.colors.textDark,
        marginBottom: 16,
    },
    chartWrapper: {
        alignItems: "center",
        marginBottom: 8,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    } as any,
    chartNote: {
        fontSize: 12,
        color: theme.colors.textGrey,
        textAlign: "center",
        marginTop: 8,
    },
    noDataContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 12,
        marginBottom: 24,
    },
    noDataText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.textGrey,
        textAlign: "center",
    },
    tableContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tableTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: theme.colors.textDark,
        marginBottom: 16,
    },
    tableHeader: {
        flexDirection: "row",
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight || "#e5e5e5",
        marginBottom: 8,
    },
    tableHeaderText: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.textDark,
    },
    tableDateColumn: {
        flex: 2,
    },
    tableRateColumn: {
        flex: 2,
        textAlign: "right",
    },
    tableStatusColumn: {
        flex: 1.5,
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    tableCell: {
        fontSize: 14,
        color: theme.colors.textDark,
    },
    tableStatusCell: {
        flex: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 70,
        alignItems: "center",
    },
    statusBadgeActive: {
        backgroundColor: `${theme.colors.successLight}20`,
    },
    statusBadgeInactive: {
        backgroundColor: `${theme.colors.errorLight}20`,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
        textTransform: "capitalize",
    },
    statusTextActive: {
        color: theme.colors.success,
    },
    statusTextInactive: {
        color: theme.colors.error,
    },
});


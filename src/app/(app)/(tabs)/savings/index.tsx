import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import MySchemesContent from "./MySchemesContent";
import JoinSchemesContent from "../home/schemes";

const { width } = Dimensions.get("window");

export default function SchemesHub() {
    const { t } = useTranslation();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"My Schemes" | "Join Schemes">(
        "My Schemes"
    );
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    const navigateTab = (tab: "My Schemes" | "Join Schemes") => {
        setActiveTab(tab);
        Animated.timing(slideAnim, {
            toValue: tab === "My Schemes" ? 0 : -width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[theme.colors.primary, darkenColor(theme.colors.primary, 0.2)]}
                style={styles.headerArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/(tabs)/home")}
                            style={{ padding: 4, marginRight: 12 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: COLORS.white }}>
                            {typeof t("schemes") === 'object' ? t("schemes.title") : t("schemes") || "Schemes"}
                        </Text>
                    </View>

                    {/* Top Tab Switcher */}
                    <View style={styles.tabContainer}>
                        <View style={styles.segmentedControl}>
                            <TouchableOpacity
                                style={[
                                    styles.tabButton,
                                    activeTab === "My Schemes" && styles.activeTabButton,
                                ]}
                                onPress={() => navigateTab("My Schemes")}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.tabButtonText,
                                        activeTab === "My Schemes" && styles.activeTabButtonText,
                                    ]}
                                >
                                    {t("mySchemes") || "My Schemes"}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.tabButton,
                                    activeTab === "Join Schemes" && styles.activeTabButton,
                                ]}
                                onPress={() => navigateTab("Join Schemes")}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.tabButtonText,
                                        activeTab === "Join Schemes" && styles.activeTabButtonText,
                                    ]}
                                >
                                    {t("joinSchemes") || "Join Schemes"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* Swipeable Content Area */}
            <View style={{ flex: 1, overflow: "hidden" }}>
                <Animated.View
                    style={[
                        styles.slider,
                        { transform: [{ translateX: slideAnim }] },
                    ]}
                >
                    {/* Tab 1: My Schemes */}
                    <View style={{ width, flex: 1 }}>
                        <MySchemesContent isNested={true} />
                    </View>

                    {/* Tab 2: Join Schemes */}
                    <View style={{ width, flex: 1 }}>
                        <JoinSchemesContent isNested={true} />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}

// Utility for darkening header slightly
function darkenColor(hex: string, percent: number): string {
    if (!hex) return "#000";
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - percent)));
    const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - percent)));
    return `rgba(${r}, ${g}, ${b}, 1)`;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerArea: {
        paddingBottom: 10,
        // Removed borderBottomLeftRadius and borderBottomRightRadius to remain flat
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
        }),
        zIndex: 10,
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    segmentedControl: {
        flexDirection: "row",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 6,
    },
    activeTabButton: {
        backgroundColor: COLORS.white,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.white,
        textShadowColor: "rgba(0,0,0,0.1)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    activeTabButtonText: {
        color: theme.colors.primary,
        textShadowColor: "transparent",
    },
    slider: {
        flex: 1,
        flexDirection: "row",
        width: width * 2,
    },
});

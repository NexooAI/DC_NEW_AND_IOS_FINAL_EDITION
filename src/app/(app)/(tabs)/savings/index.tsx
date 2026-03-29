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
                colors={["#F2E6D2", "#F5DEB3"]}
                style={styles.headerArea}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0, paddingTop: 2 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/(tabs)/home")}
                            style={{ padding: 4, marginRight: 12 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: "#1a1a1a" }}>
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



const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    headerArea: {
        paddingBottom: 0,
        // Elevation and shadow for the sticky header look
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
        zIndex: 10,
    },
    tabContainer: {
        paddingHorizontal: 20,
        paddingTop: 0,
    },
    segmentedControl: {
        flexDirection: "row",
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 6,
    },
    activeTabButton: {
        backgroundColor: "#1a1a1a",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
    },
    activeTabButtonText: {
        color: COLORS.white,
    },
    slider: {
        flex: 1,
        flexDirection: "row",
        width: width * 2,
    },
});

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

                    <View style={styles.pillSwitcherContainer}>
                        <View style={styles.pillSwitcherBg}>
                            <TouchableOpacity
                                style={[
                                    styles.pillTabItem,
                                    activeTab === "My Schemes" && styles.pillTabActive
                                ]}
                                onPress={() => navigateTab("My Schemes")}
                                activeOpacity={0.9}
                            >
                                {activeTab === "My Schemes" && (
                                    <LinearGradient
                                        colors={['#FFD700', '#DAA520']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.pillTabText,
                                        activeTab === "My Schemes" && styles.pillTabActiveText,
                                    ]}
                                >
                                    {t("mySchemes") || "My Schemes"}
                                </Text>
                            </TouchableOpacity>
 
                            <TouchableOpacity
                                style={[
                                    styles.pillTabItem,
                                    activeTab === "Join Schemes" && styles.pillTabActive
                                ]}
                                onPress={() => navigateTab("Join Schemes")}
                                activeOpacity={0.9}
                            >
                                {activeTab === "Join Schemes" && (
                                    <LinearGradient
                                        colors={['#FFD700', '#DAA520']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                )}
                                <Text
                                    style={[
                                        styles.pillTabText,
                                        activeTab === "Join Schemes" && styles.pillTabActiveText,
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
    pillSwitcherContainer: {
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    pillSwitcherBg: {
        flexDirection: "row",
        backgroundColor: "rgba(0,0,0,0.06)",
        borderRadius: 25,
        padding: 4,
        overflow: 'hidden',
    },
    pillTabItem: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: 'center',
        borderRadius: 22,
        overflow: 'hidden',
    },
    pillTabActive: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    pillTabText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#666",
        zIndex: 1,
    },
    pillTabActiveText: {
        color: "#000",
        fontWeight: "900",
    },
    slider: {
        flex: 1,
        flexDirection: "row",
        width: width * 2,
    },
});

import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import MySchemesContent from "./MySchemesContent";
import JoinSchemesContent from "../home/schemes";

const { width } = Dimensions.get("window");

export default function SchemesHub() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string }>();
    
    const initialTab = params.tab === "join" ? "Join Schemes" : "My Schemes";
    const [activeTab, setActiveTab] = useState<"My Schemes" | "Join Schemes">(
        initialTab
    );
    const slideAnim = React.useRef(new Animated.Value(initialTab === "My Schemes" ? 0 : -width)).current;

    const navigateTab = (tab: "My Schemes" | "Join Schemes") => {
        setActiveTab(tab);
        Animated.timing(slideAnim, {
            toValue: tab === "My Schemes" ? 0 : -width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    React.useEffect(() => {
        if (params.tab === "join" && activeTab !== "Join Schemes") {
            navigateTab("Join Schemes");
        } else if (params.tab === "my" && activeTab !== "My Schemes") {
            navigateTab("My Schemes");
        }
    }, [params.tab]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={theme.colors.quaternary || '#F2E6D2'} />
            <View style={[styles.headerArea, { backgroundColor: theme.colors.quaternary || '#F2E6D2' }]}>
                <SafeAreaView edges={Platform.OS === 'ios' ? [] : ["top"]} style={{ backgroundColor: "transparent" }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 2 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/(app)/(tabs)/home")}
                            style={{ padding: 4 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.colors.primary || "#850111"} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: theme.colors.primary || "#850111", flex: 1, textAlign: 'center' }}>
                            {typeof t("schemes") === 'object' ? t("schemes.title") : t("schemes") || "Schemes"}
                        </Text>
                        <View style={{ width: 32 }} />
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
            </View>

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
        color: "rgba(133, 1, 17, 0.6)",
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

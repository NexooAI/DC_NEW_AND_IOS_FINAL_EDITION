import useGlobalStore, { useAppTheme } from "@/store/global.store";
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
    BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import { COLORS } from "@/constants/colors";
import { useTranslation } from "@/hooks/useTranslation";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppVisibility, isSchemesV2Active } from "@/hooks/useAppVisibility";

import MySchemesContent from "./MySchemesContent";
import JoinSchemesContent from "../home/schemes";

const { width } = Dimensions.get("window");

export default function SchemesHub() {
  const theme = useAppTheme();
  styles = getStyles(theme);
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string; investmentId?: string }>();
    
    const initialTab = params.tab === "join" ? "Join Schemes" : "My Schemes";
    const [activeTab, setActiveTab] = useState<"My Schemes" | "Join Schemes">(
        initialTab
    );
    const [isSchemeDetailOpen, setIsSchemeDetailOpen] = useState(false);
    const joinSchemesBackRef = React.useRef<(() => boolean) | null>(null);

    const slideAnim = React.useRef(new Animated.Value(initialTab === "My Schemes" ? 0 : -width)).current;

    const { visibleData } = useAppVisibility();
    const isV2 = isSchemesV2Active(visibleData);
    const { setTabVisibility } = useGlobalStore();

    // Bottom tab bar removal in Version 2 ONLY:
    // When in Join Schemes or viewing Scheme Details in Version 2, completely remove the bottom tab bar and all spaces.
    // When switched to Version 1, preserve the exact existing behavior (bottom tab bar remains visible).
    React.useEffect(() => {
        if (!isV2) {
            setTabVisibility(true);
            return;
        }

        if (activeTab === "Join Schemes" || isSchemeDetailOpen) {
            setTabVisibility(false);
        } else {
            setTabVisibility(true);
        }
    }, [isV2, activeTab, isSchemeDetailOpen, setTabVisibility]);

    // Restore bottom tab bar when leaving Savings
    useFocusEffect(
        React.useCallback(() => {
            if (isV2 && (activeTab === "Join Schemes" || isSchemeDetailOpen)) {
                setTabVisibility(false);
            } else {
                setTabVisibility(true);
            }
            return () => {
                setTabVisibility(true);
            };
        }, [isV2, activeTab, isSchemeDetailOpen, setTabVisibility])
    );

    const navigateTab = (tab: "My Schemes" | "Join Schemes") => {
        if (tab === "My Schemes" && isSchemeDetailOpen) {
            joinSchemesBackRef.current?.();
        }
        setActiveTab(tab);
        Animated.timing(slideAnim, {
            toValue: tab === "My Schemes" ? 0 : -width,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const handleBackPress = () => {
        // Step 1: If scheme detail is open, back goes to Join Schemes list
        if (isSchemeDetailOpen && joinSchemesBackRef.current?.()) {
            return;
        }
        // Step 2: If on Join Schemes list, back goes to My Schemes tab
        if (activeTab === "Join Schemes") {
            navigateTab("My Schemes");
        } else {
            // Step 3: If on My Schemes tab, back goes to Home
            router.push("/(app)/(tabs)/home");
        }
    };

    // Hardware back button support for step-by-step navigation
    React.useEffect(() => {
        const onHardwareBack = () => {
            if (isSchemeDetailOpen && joinSchemesBackRef.current?.()) {
                return true;
            }
            if (activeTab === "Join Schemes") {
                navigateTab("My Schemes");
                return true;
            }
            return false;
        };
        const sub = BackHandler.addEventListener("hardwareBackPress", onHardwareBack);
        return () => sub.remove();
    }, [isSchemeDetailOpen, activeTab]);

    React.useEffect(() => {
        if (params.tab === "join" && activeTab !== "Join Schemes") {
            navigateTab("Join Schemes");
        } else if ((params.tab === "my" || params.tab === "My Schemes" || params.investmentId) && activeTab !== "My Schemes") {
            navigateTab("My Schemes");
        }
    }, [params.tab, params.investmentId]);

    const isDark = theme.colors.background === '#121212';
    const barStyle = isDark ? "light-content" : "dark-content";

    const headerTitle = isSchemeDetailOpen
        ? (t("schemeDetails") || "Scheme Details")
        : (activeTab === "My Schemes" ? (t("mySchemes") || "My Schemes") : (t("joinSchemes") || "Join Schemes"));

    const headerBg = theme.colors.background || "#FFFFFF";
    const headerTextColor = theme.colors.primary || theme.colors.textDark || "#0e1e38";

    return (
        <View style={styles.container}>
            <StatusBar barStyle={barStyle} backgroundColor={headerBg} />
            <View style={[styles.headerArea, { backgroundColor: headerBg }]}>
                <SafeAreaView edges={["top"]} style={{ backgroundColor: "transparent" }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10 }}>
                        <TouchableOpacity
                            onPress={handleBackPress}
                            style={{ padding: 4 }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-back" size={24} color={headerTextColor} />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 20, fontWeight: "700", color: headerTextColor, flex: 1, textAlign: 'center' }}>
                            {headerTitle}
                        </Text>
                        {activeTab === "My Schemes" && !isSchemeDetailOpen ? (
                            <TouchableOpacity
                                onPress={() => navigateTab("Join Schemes")}
                                style={{ padding: 4 }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="add" size={28} color={headerTextColor} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 32 }} />
                        )}
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
                        <JoinSchemesContent
                            isNested={true}
                            onDetailChange={setIsSchemeDetailOpen}
                            detailBackRef={joinSchemesBackRef}
                        />
                    </View>
                </Animated.View>
            </View>
        </View>
    );
}



function getStyles(theme: any) { return StyleSheet.create({
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
}) }

var styles = getStyles(theme);;

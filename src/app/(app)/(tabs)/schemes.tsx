import { useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import { theme } from "@/constants/theme";

export default function SchemesTab() {
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            // Navigate to the schemes screen in home stack when tab is focused
            router.push("/(app)/(tabs)/home/schemes");
        }, [router])
    );

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
    );
}


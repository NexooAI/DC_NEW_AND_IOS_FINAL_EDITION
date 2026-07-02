import { useAppTheme } from "@/store/global.store";
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationTester from '@/components/NotificationTester';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function TestNotificationsScreen() {
  const theme = useAppTheme();
  styles = getStyles(theme);
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notification Tester</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Tester Component */}
            <NotificationTester />
        </SafeAreaView>
    );
}

function getStyles(theme: any) { return StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
}) }

var styles = getStyles(theme);;


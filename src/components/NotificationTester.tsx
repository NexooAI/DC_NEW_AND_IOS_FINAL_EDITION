import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/theme';
import { logger } from '@/utils/logger';

interface TestNotification {
    title: string;
    body: string;
    screen: string;
    type: string;
    color: string;
}

const testNotifications: TestNotification[] = [
    {
        title: '🔔 General Notification',
        body: 'Tap to go to Notifications screen',
        screen: 'notifications',
        type: 'general',
        color: '#2196F3',
    },
    {
        title: '🎁 Special Offer!',
        body: 'Tap to view schemes and offers',
        screen: 'schemes',
        type: 'offer',
        color: '#FF5722',
    },
    {
        title: '💰 Transaction Update',
        body: 'Tap to view your transactions',
        screen: 'transactions',
        type: 'transaction',
        color: '#4CAF50',
    },
    {
        title: '📈 Gold Rate Alert',
        body: 'Gold prices updated! Tap to check',
        screen: 'gold-rate',
        type: 'rate',
        color: '#FFD700',
    },
    {
        title: '🏠 Home Update',
        body: 'Tap to go to Home screen',
        screen: 'home',
        type: 'general',
        color: '#9C27B0',
    },
    {
        title: '💵 Savings Update',
        body: 'Check your savings progress',
        screen: 'savings',
        type: 'reminder',
        color: '#00BCD4',
    },
];

export default function NotificationTester() {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);

    const scheduleTestNotification = async (notification: TestNotification) => {
        try {
            // Schedule a notification with 3 second delay
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.body,
                    data: {
                        type: notification.type,
                        screen: notification.screen,
                    },
                    sound: 'notification.wav',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 3,
                },
            });

            Alert.alert(
                '✅ Notification Scheduled',
                `"${notification.title}" will appear in 3 seconds.\n\n` +
                `• Minimize the app (press home button)\n` +
                `• Wait for notification\n` +
                `• Tap notification to test navigation to: ${notification.screen}`,
                [{ text: 'OK' }]
            );

            logger.log(`📤 Scheduled test notification: ${notification.title} → ${notification.screen}`);
        } catch (error) {
            logger.error('Error scheduling notification:', error);
            Alert.alert('Error', 'Failed to schedule notification. Make sure you have notification permissions.');
        }
    };

    const scheduleImmediateNotification = async (notification: TestNotification) => {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: notification.title,
                    body: notification.body,
                    data: {
                        type: notification.type,
                        screen: notification.screen,
                    },
                    sound: 'notification.wav',
                },
                trigger: null, // Immediate
            });

            logger.log(`📤 Sent immediate notification: ${notification.title}`);
        } catch (error) {
            logger.error('Error sending notification:', error);
        }
    };

    const showFcmToken = async () => {
        try {
            const token = await AsyncStorage.getItem('fcmToken');
            const expoPushToken = await AsyncStorage.getItem('expoPushToken');

            setFcmToken(token);
            setShowToken(true);

            logger.log('FCM Token:', token);
            logger.log('Expo Push Token:', expoPushToken);

            if (token) {
                Alert.alert(
                    '🔑 FCM Token',
                    `Token: ${token.substring(0, 50)}...\n\nFull token logged to console. Use this token in Firebase Console to send test notifications.`,
                    [
                        { text: 'Copy to Log', onPress: () => logger.log('FULL FCM TOKEN:', token) },
                        { text: 'OK' }
                    ]
                );
            } else {
                Alert.alert(
                    '⚠️ No Token Found',
                    'FCM token not found. This may happen if:\n\n' +
                    '• Running in Expo Go (use dev build)\n' +
                    '• Notification permissions denied\n' +
                    '• App not properly configured'
                );
            }
        } catch (error) {
            logger.error('Error getting FCM token:', error);
        }
    };

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();

        if (status === 'granted') {
            Alert.alert('✅ Permissions Granted', 'Notification permissions are enabled.');
        } else {
            Alert.alert(
                '⚠️ Permissions Not Granted',
                `Current status: ${status}\n\nWould you like to request permissions?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Request',
                        onPress: async () => {
                            const { status: newStatus } = await Notifications.requestPermissionsAsync();
                            Alert.alert('Permission Status', `New status: ${newStatus}`);
                        }
                    }
                ]
            );
        }
    };

    const cancelAllNotifications = async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        Alert.alert('✅ Cancelled', 'All scheduled notifications have been cancelled.');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>🧪 Notification Tester</Text>
            <Text style={styles.subtitle}>
                Test push notification tap → navigation
            </Text>

            {/* Utility Buttons */}
            <View style={styles.utilitySection}>
                <TouchableOpacity
                    style={[styles.utilityButton, { backgroundColor: '#607D8B' }]}
                    onPress={checkPermissions}
                >
                    <Text style={styles.utilityButtonText}>🔐 Check Permissions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.utilityButton, { backgroundColor: '#795548' }]}
                    onPress={showFcmToken}
                >
                    <Text style={styles.utilityButtonText}>🔑 Show FCM Token</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.utilityButton, { backgroundColor: '#F44336' }]}
                    onPress={cancelAllNotifications}
                >
                    <Text style={styles.utilityButtonText}>🚫 Cancel All</Text>
                </TouchableOpacity>
            </View>

            {/* Test Notification Buttons */}
            <Text style={styles.sectionTitle}>📱 Test Notifications (3 sec delay)</Text>
            <Text style={styles.hint}>
                Tap a button, then minimize the app. Tap the notification when it appears.
            </Text>

            {testNotifications.map((notification, index) => (
                <TouchableOpacity
                    key={index}
                    style={[styles.testButton, { backgroundColor: notification.color }]}
                    onPress={() => scheduleTestNotification(notification)}
                >
                    <View style={styles.buttonContent}>
                        <Text style={styles.buttonTitle}>{notification.title}</Text>
                        <Text style={styles.buttonBody}>{notification.body}</Text>
                        <Text style={styles.buttonScreen}>→ {notification.screen}</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Instructions */}
            <View style={styles.instructions}>
                <Text style={styles.instructionsTitle}>📋 How to Test:</Text>
                <Text style={styles.instructionText}>
                    1. Tap any test button above{'\n'}
                    2. Minimize the app (press home button){'\n'}
                    3. Wait for the notification (3 seconds){'\n'}
                    4. Tap the notification{'\n'}
                    5. App should open and navigate to the target screen
                </Text>
            </View>

            {/* FCM Token Display */}
            {showToken && fcmToken && (
                <View style={styles.tokenContainer}>
                    <Text style={styles.tokenTitle}>FCM Token:</Text>
                    <Text style={styles.tokenText} selectable>{fcmToken}</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a2a39',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    hint: {
        fontSize: 12,
        color: '#888',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    utilitySection: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    utilityButton: {
        flex: 1,
        minWidth: '30%',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginHorizontal: 4,
        marginBottom: 8,
    },
    utilityButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    testButton: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonContent: {
        flexDirection: 'column',
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    buttonBody: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 8,
    },
    buttonScreen: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: '600',
    },
    instructions: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
    },
    instructionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1565C0',
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#1976D2',
        lineHeight: 22,
    },
    tokenContainer: {
        backgroundColor: '#fff3e0',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
    },
    tokenTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#E65100',
        marginBottom: 8,
    },
    tokenText: {
        fontSize: 10,
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
});


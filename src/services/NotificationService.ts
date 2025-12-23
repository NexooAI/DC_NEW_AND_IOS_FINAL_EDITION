import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userAPI } from '@/services/api';
import useGlobalStore from '@/store/global.store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Device from 'expo-device';

import { logger } from '@/utils/logger';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';
// Simple UUID generator function
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Configure how notifications appear when the app is in foreground
// Only configure if not in Expo Go (where push notifications are not supported)
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    logger.warn('Could not set notification handler (may be running in Expo Go):', error);
  }
}

class NotificationService {
  private isSendingToken = false;

  // Helper method to check Google Services configuration
  private async checkGoogleServicesConfig() {
    try {
      const googleServicesPath = FileSystem.documentDirectory + 'google-services.json';
      const fileInfo = await FileSystem.getInfoAsync(googleServicesPath);

      logger.log('📱 Google Services Configuration Check:', {
        fileExists: fileInfo.exists,
        fileSize: fileInfo.exists ? (fileInfo as any).size : 'N/A',
        fileUri: fileInfo.uri,
        platform: Platform.OS,
        projectId: Constants?.expoConfig?.extra?.eas?.projectId,
        expoConfig: {
          extra: Constants?.expoConfig?.extra,
          eas: Constants?.expoConfig?.extra?.eas
        }
      });

      return fileInfo.exists;
    } catch (error) {
      logger.error('❌ Error checking Google Services config:', error);
      return false;
    }
  }

  private async storeFcmToken(token: string) {
    try {
      await AsyncStorage.setItem('fcmToken', token);
      logger.log('FCM token stored locally');
    } catch (error) {
      logger.error('Error storing FCM token:', error);
    }
  }

  private async getStoredFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('fcmToken');
    } catch (error) {
      logger.error('Error getting stored FCM token:', error);
      return null;
    }
  }

  private async getLastSentFcmToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('lastSentFcmToken');
    } catch (error) {
      logger.error('Error getting last sent FCM token:', error);
      return null;
    }
  }

  private async storeLastSentFcmToken(token: string) {
    logger.log('lastSentFcmToken', token);
    try {
      await AsyncStorage.setItem('lastSentFcmToken', token);
    } catch (error) {
      logger.error('Error storing last sent FCM token:', error);
    }
  }

  private async storeExpoPushToken(token: string) {
    try {
      await AsyncStorage.setItem('expoPushToken', token);
      logger.log('Expo Push Token stored locally');
    } catch (error) {
      logger.error('Error storing Expo Push Token:', error);
    }
  }

  private async getStoredExpoPushToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('expoPushToken');
    } catch (error) {
      logger.error('Error getting stored Expo Push Token:', error);
      return null;
    }
  }

  private async storeExpoPushTokenPayload(payload: any) {
    try {
      await AsyncStorage.setItem('expoPushTokenPayload', JSON.stringify(payload));
      logger.log('Expo Push Token Payload stored locally');
    } catch (error) {
      logger.error('Error storing Expo Push Token Payload:', error);
    }
  }

  private async getStoredExpoPushTokenPayload(): Promise<any | null> {
    try {
      const payload = await AsyncStorage.getItem('expoPushTokenPayload');
      return payload ? JSON.parse(payload) : null;
    } catch (error) {
      logger.error('Error getting stored Expo Push Token Payload:', error);
      return null;
    }
  }

  // Get FCM token for notifications
  async getFcmTokenAsync() {
    // Skip if running in Expo Go (push notifications not supported)
    if (isExpoGo) {
      logger.warn('⚠️ Push notifications are not supported in Expo Go. Use a development build instead.');
      return null;
    }

    let fcmToken;
    let expoPushToken;
    let expoPushTokenPayload: any = null;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (error) {
        logger.warn('Could not set notification channel:', error);
      }
    }

    // Get notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logger.log('❌ Notification permissions not granted');
      return null;
    }

    try {

      // Check Google Services configuration
      await this.checkGoogleServicesConfig();

      // Get project ID from Expo config
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        logger.error('❌ Project ID not found in Expo config');
        return null;
      }

      // Log FCM token generation details
      logger.log('🔍 FCM Token Generation Debug Info:', {
        projectId,
        platform: Platform.OS,
        permissionsStatus: finalStatus
      });

      // Create a custom fetch interceptor to capture the getExpoPushToken payload
      const originalFetch = global.fetch;
      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        // Check if this is the getExpoPushToken request
        if (url.includes('exp.host') && url.includes('getExpoPushToken')) {
          logger.log('🎯 Intercepted getExpoPushToken request:', {
            url,
            method: init?.method,
            body: init?.body
          });

          // Capture the payload
          if (init?.body) {
            try {
              expoPushTokenPayload = JSON.parse(init.body as string);
              logger.log('📦 Captured getExpoPushToken payload:', expoPushTokenPayload);
            } catch (e) {
              logger.error('❌ Error parsing getExpoPushToken payload:', e);
            }
          }
        }

        // Call the original fetch
        return originalFetch(input, init);
      };

      // Get FCM token using Expo Notifications
      const expoPushTokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Restore original fetch
      global.fetch = originalFetch;

      // Store both the full Expo Push Token and the cleaned FCM token
      expoPushToken = expoPushTokenResponse.data; // Full Expo Push Token
      fcmToken = expoPushTokenResponse.data.replace('ExponentPushToken[', '').replace(']', ''); // Cleaned FCM token

      // The captured payload already has the correct deviceToken, so we should use that
      if (expoPushTokenPayload && expoPushTokenPayload.deviceToken) {
        fcmToken = expoPushTokenPayload.deviceToken; // Use the deviceToken from the captured payload
        logger.log('✅ Using deviceToken from captured payload:', fcmToken);
      }

      // Store both tokens locally
      await this.storeFcmToken(fcmToken);
      await this.storeExpoPushToken(expoPushToken);

      // Store the captured payload for later use
      if (expoPushTokenPayload) {
        await this.storeExpoPushTokenPayload(expoPushTokenPayload);
      }

      // Immediately try to send FCM token to API
      await this.sendFcmTokenToApi(fcmToken);

      logger.log('✅ FCM token generated and stored:', fcmToken);
      logger.log('✅ Expo Push Token:', expoPushToken);
      logger.log('✅ Captured getExpoPushToken payload:', expoPushTokenPayload);
      return fcmToken;
    } catch (error) {
      // Restore original fetch in case of error
      global.fetch = global.fetch || global.fetch;

      // Debugger: Add breakpoint for FCM token generation errors
      logger.error('❌ Error getting FCM token:', error);
      logger.log('🔍 Error details for debugging:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        platform: Platform.OS
      });
      return null;
    }
  }

  // New method to send FCM token to API when user info is available
  async sendFcmTokenToApi(fcmToken?: string): Promise<void> {
    // Skip if running in Expo Go
    if (isExpoGo) {
      logger.warn('⚠️ Skipping FCM token API call - running in Expo Go (notifications not supported)');
      return;
    }

    if (this.isSendingToken) return;
    this.isSendingToken = true;
    try {
      // If FCM token is not provided, try to get it from storage or generate new one
      if (!fcmToken) {
        const storedFcmToken = await this.getStoredFcmToken();
        fcmToken = storedFcmToken || undefined;
      }

      if (!fcmToken) {
        logger.log('🔄 No FCM token found, attempting to generate new FCM token...');
        // Try to generate a new FCM token if none exists
        const newFcmToken = await this.getFcmTokenAsync();
        if (!newFcmToken) {
          logger.log('❌ Failed to generate new FCM token');
          this.isSendingToken = false;
          return;
        }
        // FCM token was generated and stored, continue with sending
        this.isSendingToken = false;
        return this.sendFcmTokenToApi(newFcmToken); // Recursively call with the new FCM token
      }

      // Get user data from store or storage
      let userId = 0;
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userId = Number(userData.user_id) || 0;
      } else {
        // Try to get from global store if available
        const user = useGlobalStore.getState().user;
        if (user) {
          userId = Number((user as any).user_id || user.id) || 0;
        }
      }

      if (userId > 0) {
        // Check last sent FCM token to avoid redundant API calls
        const lastSentFcmToken = await this.getLastSentFcmToken();
        if (lastSentFcmToken === fcmToken) {
          logger.log('✅ FCM token already sent, skipping update');
          this.isSendingToken = false;
          return;
        }

        // Try to get the captured getExpoPushToken payload first
        let fcmData = await this.getStoredExpoPushTokenPayload();

        // If no captured payload, fall back to constructing it manually
        if (!fcmData) {
          logger.log('⚠️ No captured getExpoPushToken payload found, using fallback construction');
          fcmData = {
            type: "fcm",
            deviceId: generateUUID(), // Generate UUID like in the screenshot
            development: __DEV__, // true for development, false for production
            appId: "com.dcjewellers.dcjewellers", // Use the exact app bundle ID
            deviceToken: fcmToken, // This is the actual FCM token
            projectId: "07310377-0452-4d15-8e38-d42462be6fd8" // Use the exact project ID
          };
        } else {
          // Use the exact same payload without modifying deviceToken
          logger.log('✅ Using exact captured getExpoPushToken payload without modifications');
        }

        const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';

        // Ensure FCM token is available
        if (!fcmToken) {
          logger.error('❌ Missing required FCM token for API call:', { fcmToken });
          this.isSendingToken = false;
          return;
        }

        // Add the additional required parameters to the payload
        const finalPayload = {
          ...fcmData, // Spread the getExpoPushToken payload
          userId: userId,
          token: fcmData.deviceToken, // Use deviceToken as token
          device_type: deviceType
        };

        logger.log('📤 Sending FCM token with complete payload structure:', finalPayload);

        try {
          // Send FCM token with complete payload structure
          const response = await userAPI.updateFcmTokenWithCompleteData(finalPayload, userId, deviceType);
          logger.log('✅ FCM token with complete data response:', response);
          await this.storeLastSentFcmToken(fcmToken);
        } catch (error: any) {
          logger.error('❌ Error sending FCM token with complete data:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          throw error;
        }
      } else {
        logger.log('⚠️ Skipping FCM token update - No valid user ID found');
      }
    } catch (error: any) {
      logger.error('❌ Error handling FCM token:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    } finally {
      this.isSendingToken = false;
    }
  }

  // Schedule a local notification
  async scheduleLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // null means show immediately
    });
  }

  // Schedule a delayed notification
  async scheduleDelayedNotification(title: string, body: string, seconds: number, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  }

  // Cancel all scheduled notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Add notification received listener
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Add notification response received listener
  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Setup notifications - initialize FCM token and permissions
  async setupNotifications() {
    // Skip if running in Expo Go
    if (isExpoGo) {
      logger.warn('⚠️ Skipping notification setup - running in Expo Go (notifications not supported)');
      return;
    }

    try {
      logger.log('🔧 Setting up notifications...');
      await this.getFcmTokenAsync();
      logger.log('✅ Notifications setup completed');
    } catch (error) {
      logger.error('❌ Error setting up notifications:', error);
    }
  }

  // Method to manually capture getExpoPushToken payload for testing
  async captureGetExpoPushTokenPayload() {
    try {
      logger.log('🎯 Manually capturing getExpoPushToken payload...');
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        logger.error('❌ Project ID not found in Expo config');
        return null;
      }

      // Create a custom fetch interceptor to capture the payload
      const originalFetch = global.fetch;
      let capturedPayload: any = null;

      global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();

        // Check if this is the getExpoPushToken request
        if (url.includes('exp.host') && url.includes('getExpoPushToken')) {
          logger.log('🎯 Intercepted getExpoPushToken request:', {
            url,
            method: init?.method,
            body: init?.body
          });

          // Capture the payload
          if (init?.body) {
            try {
              capturedPayload = JSON.parse(init.body as string);
              logger.log('📦 Captured getExpoPushToken payload:', capturedPayload);
            } catch (e) {
              logger.error('❌ Error parsing getExpoPushToken payload:', e);
            }
          }
        }

        // Call the original fetch
        return originalFetch(input, init);
      };

      // Make the request to capture the payload
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      // Restore original fetch
      global.fetch = originalFetch;

      // Store the captured payload
      if (capturedPayload) {
        await this.storeExpoPushTokenPayload(capturedPayload);
        logger.log('✅ getExpoPushToken payload captured and stored');
        return capturedPayload;
      } else {
        logger.log('❌ No payload captured');
        return null;
      }
    } catch (error) {
      logger.error('❌ Error capturing getExpoPushToken payload:', error);
      return null;
    }
  }
}

export default new NotificationService(); 
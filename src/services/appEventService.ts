import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './api';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';

// Helper to get or generate a persistent device ID
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      if (Platform.OS === 'android') {
        deviceId = (Application as any).androidId || '';
        if (!deviceId && typeof (Application as any).getAndroidId === 'function') {
          try {
            deviceId = await (Application as any).getAndroidId();
          } catch (e) {
            // Ignore error
          }
        }
      }
      if (!deviceId) {
        // Fallback: Generate UUID
        deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      }
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  } catch (error) {
    logger.error('Error getting device ID:', error);
    return 'unknown_device';
  }
};

// Log device information (sent immediately as it contains FCM token & os registration details)
export const logDeviceInfo = async (force = false): Promise<void> => {
  try {
    const user = useGlobalStore.getState().user;
    if (!user) return; // Only log for authenticated users

    const now = Date.now();
    const lastLoggedStr = await AsyncStorage.getItem('lastLoggedDeviceInfo');
    const lastLogged = lastLoggedStr ? parseInt(lastLoggedStr, 10) : 0;

    // Log at most once every 15 minutes to prevent redundant requests
    if (!force && now - lastLogged < 15 * 60 * 1000) {
      logger.log('📱 Device info log skipped (logged recently)');
      return;
    }

    const fcmToken = (await AsyncStorage.getItem('fcmToken')) || '';
    const deviceId = await getDeviceId();

    const deviceInfo = {
      os: Platform.OS === 'ios' ? 'iOS' : 'Android',
      name: user.name || user.username || 'User',
      brand: Device.brand || '',
      model: Device.modelName || '',
      userId: Number(user.id) || null,
      deviceId: deviceId,
      fcmToken: fcmToken,
      mobileNo: user.mobile ? String(user.mobile) : '',
      osVersion: Device.osVersion || '',
      appVersion: Application.nativeApplicationVersion || '3.0.3',
    };

    logger.log('📤 Logging Device Info:', deviceInfo);

    await apiClient.post('/app-events/device-info', { deviceInfo }, { skipLoading: true } as any);
    await AsyncStorage.setItem('lastLoggedDeviceInfo', String(now));
  } catch (error) {
    logger.error('Failed to log device info:', error);
  }
};

// Log generic app events immediately
export const logAppEvent = async (eventName: string, metadata: Record<string, any> = {}): Promise<void> => {
  try {
    const user = useGlobalStore.getState().user;
    const deviceId = await getDeviceId();

    const eventMetadata = {
      userId: user ? Number(user.id) : null,
      mobileNo: user?.mobile ? String(user.mobile) : '',
      deviceId,
      os: Platform.OS === 'ios' ? 'iOS' : 'Android',
      brand: Device.brand || '',
      model: Device.modelName || '',
      osVersion: Device.osVersion || '',
      appVersion: Application.nativeApplicationVersion || '3.0.3',
      ...metadata,
    };

    logger.log(`📤 Logging App Event immediately: ${eventName}`);
    await apiClient.post('/app-events/log', { eventName, metadata: eventMetadata }, { skipLoading: true } as any);
  } catch (error) {
    logger.error(`Failed to log app event ${eventName}:`, error);
  }
};


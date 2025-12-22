import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { logger } from '@/utils/logger';

const BIOMETRIC_MPIN_KEY = 'user_biometric_mpin';

export const useBiometrics = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType[]>([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            setIsSupported(compatible);

            if (compatible) {
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                setBiometricType(types);

                const enrolled = await LocalAuthentication.isEnrolledAsync();
                setIsEnrolled(enrolled);

                // Check if user has previously enabled biometrics (by checking if MPIN is stored)
                const storedMpin = await SecureStore.getItemAsync(BIOMETRIC_MPIN_KEY);
                setIsEnabled(!!storedMpin);
            }
        } catch (error) {
            logger.error('Error checking biometrics:', error);
        }
    };

    const authenticate = async (): Promise<{ success: boolean; mpin?: string; error?: string }> => {
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) return { success: false, error: 'Hardware not supported' };

            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!isEnrolled) return { success: false, error: 'No biometrics enrolled' };

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate with Face ID / Fingerprint',
                fallbackLabel: 'Enter MPIN',
                disableDeviceFallback: false,
                cancelLabel: 'Cancel',
            });

            if (result.success) {
                // Retrieve stored MPIN
                const mpin = await SecureStore.getItemAsync(BIOMETRIC_MPIN_KEY);
                if (mpin) {
                    return { success: true, mpin };
                } else {
                    return { success: false, error: 'Biometrics enabled but MPIN not found' };
                }
            } else {
                return { success: false, error: 'Authentication failed' };
            }
        } catch (error) {
            logger.error('Biometric authentication error:', error);
            return { success: false, error: 'Authentication error' };
        }
    };

    const enableBiometrics = async (mpin: string): Promise<boolean> => {
        try {
            // First authenticate to confirm ownership before enabling
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm biometrics to enable',
            });

            if (result.success) {
                await SecureStore.setItemAsync(BIOMETRIC_MPIN_KEY, mpin);
                setIsEnabled(true);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('Error enabling biometrics:', error);
            return false;
        }
    };

    const disableBiometrics = async () => {
        try {
            await SecureStore.deleteItemAsync(BIOMETRIC_MPIN_KEY);
            setIsEnabled(false);
        } catch (error) {
            logger.error('Error disabling biometrics:', error);
        }
    };

    return {
        isSupported,
        biometricType,
        isEnrolled,
        isEnabled,
        authenticate,
        enableBiometrics,
        disableBiometrics,
        checkBiometrics
    };
};

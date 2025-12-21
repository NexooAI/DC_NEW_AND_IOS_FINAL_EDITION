// services/forceUpdateService.ts - Force Update Service
import * as Application from 'expo-application';
import * as Linking from 'expo-linking';
import { Alert } from 'react-native';
import apiClient from './api';

import { logger } from '@/utils/logger';
// ============================================================================
// TYPES
// ============================================================================

export interface AppVersionResponse {
    id: number;
    currentVersion: string;
    createdAt: string;
    updateAt: string;
    latestVersion: string;
    needsUpdate: string;
    storeUrl: string;
}

export interface ForceUpdateResult {
    needsUpdate: boolean;
    currentVersion: string;
    latestVersion: string;
    storeUrl: string;
}

// ============================================================================
// FORCE UPDATE SERVICE
// ============================================================================

class ForceUpdateService {
    private static instance: ForceUpdateService;
    private isChecking = false;
    private lastCheckTime = 0;
    private readonly CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

    static getInstance(): ForceUpdateService {
        if (!ForceUpdateService.instance) {
            ForceUpdateService.instance = new ForceUpdateService();
        }
        return ForceUpdateService.instance;
    }

    /**
     * Get the current app version
     */
    getCurrentVersion(): string {
        try {
            const version = Application.nativeApplicationVersion;
            logger.log('📱 Current app version:', version);
            return version || '1.0.0';
        } catch (error) {
            logger.error('❌ Error getting app version:', error);
            return '1.0.0';
        }
    }

    /**
     * Compare version strings (supports semantic versioning)
     * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
     */
    private compareVersions(version1: string, version2: string): number {
        try {
            const v1Parts = version1.split('.').map(Number);
            const v2Parts = version2.split('.').map(Number);

            // Ensure both arrays have the same length
            const maxLength = Math.max(v1Parts.length, v2Parts.length);
            while (v1Parts.length < maxLength) v1Parts.push(0);
            while (v2Parts.length < maxLength) v2Parts.push(0);

            for (let i = 0; i < maxLength; i++) {
                if (v1Parts[i] > v2Parts[i]) return 1;
                if (v1Parts[i] < v2Parts[i]) return -1;
            }

            return 0;
        } catch (error) {
            logger.error('❌ Error comparing versions:', error);
            return 0;
        }
    }

    /**
     * Check if app needs update by calling the API
     */
    async checkForUpdate(): Promise<ForceUpdateResult> {
        try {
            // Prevent multiple simultaneous checks
            if (this.isChecking) {
                logger.log('⏳ Update check already in progress');
                return {
                    needsUpdate: false,
                    currentVersion: this.getCurrentVersion(),
                    latestVersion: this.getCurrentVersion(),
                    storeUrl: '',
                };
            }

            // Check if we've checked recently
            const now = Date.now();
            if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
                logger.log('⏳ Update check too recent, skipping');
                return {
                    needsUpdate: false,
                    currentVersion: this.getCurrentVersion(),
                    latestVersion: this.getCurrentVersion(),
                    storeUrl: '',
                };
            }

            this.isChecking = true;
            this.lastCheckTime = now;

            logger.log('🔍 Checking for app updates...');

            const currentVersion = this.getCurrentVersion();

            // Call the API to get latest version info
            const response = await apiClient.get<AppVersionResponse[]>('/version/verify-version');
            const versionData = response.data[0]; // Get the first item from the array

            if (!versionData) {
                throw new Error('No version data received from API');
            }

            const { latestVersion, storeUrl, needsUpdate: apiNeedsUpdate } = versionData;

            logger.log('📊 Version comparison:', {
                current: currentVersion,
                latest: latestVersion,
                storeUrl,
                apiNeedsUpdate,
            });

            // Use API's needsUpdate field or fallback to version comparison
            const needsUpdate = apiNeedsUpdate === 'true' || this.compareVersions(currentVersion, latestVersion) < 0;

            const result: ForceUpdateResult = {
                needsUpdate,
                currentVersion,
                latestVersion,
                storeUrl,
            };

            logger.log('✅ Update check completed:', result);
            return result;

        } catch (error) {
            logger.error('❌ Error checking for updates:', error);

            // On error, assume no update needed to avoid blocking the app
            return {
                needsUpdate: false,
                currentVersion: this.getCurrentVersion(),
                latestVersion: this.getCurrentVersion(),
                storeUrl: '',
            };
        } finally {
            this.isChecking = false;
        }
    }

    /**
     * Open the store URL for app update
     */
    async openStore(storeUrl: string): Promise<void> {
        try {
            logger.log('🔗 Opening store URL:', storeUrl);

            const canOpen = await Linking.canOpenURL(storeUrl);
            if (canOpen) {
                await Linking.openURL(storeUrl);
                logger.log('✅ Store opened successfully');
            } else {
                logger.error('❌ Cannot open store URL:', storeUrl);
                Alert.alert(
                    'Update Required',
                    'Please update the app from your device\'s app store.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            logger.error('❌ Error opening store:', error);
            Alert.alert(
                'Update Required',
                'Please update the app from your device\'s app store.',
                [{ text: 'OK' }]
            );
        }
    }

    /**
     * Force check for updates (ignores time interval)
     */
    async forceCheckForUpdate(): Promise<ForceUpdateResult> {
        this.lastCheckTime = 0; // Reset last check time
        return this.checkForUpdate();
    }

    /**
     * Reset the service state
     */
    reset(): void {
        this.isChecking = false;
        this.lastCheckTime = 0;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ForceUpdateService.getInstance();
export { ForceUpdateService };

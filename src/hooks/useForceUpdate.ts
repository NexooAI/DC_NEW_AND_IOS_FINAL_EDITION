// hooks/useForceUpdate.ts - Force Update Hook
import { useState, useEffect, useCallback } from 'react';
import forceUpdateService, { ForceUpdateResult } from '@/services/forceUpdateService';

import { logger } from '@/utils/logger';
// ============================================================================
// TYPES
// ============================================================================

interface UseForceUpdateReturn {
    isChecking: boolean;
    needsUpdate: boolean;
    updateInfo: ForceUpdateResult | null;
    checkForUpdate: () => Promise<void>;
    retryCheck: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useForceUpdate(): UseForceUpdateReturn {
    const [isChecking, setIsChecking] = useState(false);
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<ForceUpdateResult | null>(null);

    const checkForUpdate = useCallback(async () => {
        try {
            setIsChecking(true);
            logger.log('🔍 Starting force update check...');

            const result = await forceUpdateService.checkForUpdate();

            logger.log('📊 Force update result:', result);

            setUpdateInfo(result);
            setNeedsUpdate(result.needsUpdate);

            if (result.needsUpdate) {
                logger.log('⚠️ App update required:', {
                    current: result.currentVersion,
                    latest: result.latestVersion,
                });
            } else {
                logger.log('✅ App is up to date');
            }
        } catch (error) {
            logger.error('❌ Error checking for updates:', error);
            // On error, assume no update needed to avoid blocking the app
            setNeedsUpdate(false);
            setUpdateInfo(null);
        } finally {
            setIsChecking(false);
        }
    }, []);

    const retryCheck = useCallback(async () => {
        try {
            setIsChecking(true);
            logger.log('🔄 Retrying force update check...');

            const result = await forceUpdateService.forceCheckForUpdate();

            logger.log('📊 Force update retry result:', result);

            setUpdateInfo(result);
            setNeedsUpdate(result.needsUpdate);
        } catch (error) {
            logger.error('❌ Error retrying update check:', error);
            setNeedsUpdate(false);
            setUpdateInfo(null);
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Auto-check on mount
    useEffect(() => {
        checkForUpdate();
    }, [checkForUpdate]);

    return {
        isChecking,
        needsUpdate,
        updateInfo,
        checkForUpdate,
        retryCheck,
    };
}

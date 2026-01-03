import { useEffect, useState, useCallback, useRef } from 'react';
import * as Updates from 'expo-updates';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppUpdatesReturn {
    isUpdateAvailable: boolean;
    isDownloading: boolean;
    checkForUpdate: () => Promise<void>;
    downloadAndApply: () => Promise<void>;
    dismissUpdate: () => void;
}

export function useAppUpdates(): UseAppUpdatesReturn {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const isCheckingRef = useRef(false);
    const lastCheckRef = useRef(0);

    const checkForUpdate = useCallback(async () => {
        // Prevent duplicate checks
        if (isCheckingRef.current) return;

        // Throttle: don't check more than once per 30 seconds
        const now = Date.now();
        if (now - lastCheckRef.current < 30000) {
            console.log('[Updates] Throttled, last check was recent');
            return;
        }

        try {
            // Don't check in development mode
            if (__DEV__) {
                console.log('[Updates] Skipping update check in DEV mode');
                return;
            }

            isCheckingRef.current = true;
            lastCheckRef.current = now;

            console.log('[Updates] Checking for updates...');
            const update = await Updates.checkForUpdateAsync();

            // DEBUG: Show alert with result
            const { Alert } = require('react-native');
            Alert.alert(
                'OTA Debug',
                `isAvailable: ${update.isAvailable}\nmanifest: ${update.manifest ? 'có' : 'không'}`
            );

            if (update.isAvailable) {
                console.log('[Updates] New update available!');
                setIsUpdateAvailable(true);
            } else {
                console.log('[Updates] App is up to date');
                setIsUpdateAvailable(false);
            }
        } catch (error: any) {
            console.log('[Updates] Error checking for updates:', error);
            // DEBUG: Show error alert
            const { Alert } = require('react-native');
            Alert.alert('OTA Error', error?.message || String(error));
            setIsUpdateAvailable(false);
        } finally {
            isCheckingRef.current = false;
        }
    }, []);

    const downloadAndApply = useCallback(async () => {
        try {
            setIsDownloading(true);
            console.log('[Updates] Downloading update...');

            await Updates.fetchUpdateAsync();

            console.log('[Updates] Update downloaded, reloading...');
            await Updates.reloadAsync();
        } catch (error) {
            console.log('[Updates] Error downloading update:', error);
            setIsDownloading(false);
        }
    }, []);

    const dismissUpdate = useCallback(() => {
        setIsUpdateAvailable(false);
    }, []);

    // Auto check on mount - show modal if update available
    useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdate();
        }, 2000);

        return () => clearTimeout(timer);
    }, [checkForUpdate]);

    // Also check when app comes back from background
    useEffect(() => {
        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                // Check for updates when app becomes active
                checkForUpdate();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [checkForUpdate]);

    return {
        isUpdateAvailable,
        isDownloading,
        checkForUpdate,
        downloadAndApply,
        dismissUpdate,
    };
}

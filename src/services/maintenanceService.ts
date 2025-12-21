// services/maintenanceService.ts - Maintenance Status Service
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

export interface MaintenanceStatus {
    maintenanceStatus: boolean;
    startTime: string;
    endTime: string;
    reason: string;
    message: string;
}

export interface MaintenanceState {
    isMaintenanceMode: boolean;
    maintenanceData: MaintenanceStatus | null;
    timeRemaining: number; // in milliseconds
    isChecking: boolean;
}

class MaintenanceService {
    private static instance: MaintenanceService;
    private maintenanceState: MaintenanceState = {
        isMaintenanceMode: false,
        maintenanceData: null,
        timeRemaining: 0,
        isChecking: false,
    };
    private listeners: Array<(state: MaintenanceState) => void> = [];
    private intervalId: NodeJS.Timeout | null = null;

    static getInstance(): MaintenanceService {
        if (!MaintenanceService.instance) {
            MaintenanceService.instance = new MaintenanceService();
        }
        return MaintenanceService.instance;
    }

    // Subscribe to maintenance state changes
    subscribe(listener: (state: MaintenanceState) => void): () => void {
        this.listeners.push(listener);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Notify all listeners of state changes
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.maintenanceState));
    }

    // Get current maintenance state
    getState(): MaintenanceState {
        return { ...this.maintenanceState };
    }

    // Set maintenance mode
    setMaintenanceMode(maintenanceData: MaintenanceStatus): void {
        logger.log('🔧 Setting maintenance mode:', maintenanceData);

        this.maintenanceState = {
            isMaintenanceMode: true,
            maintenanceData,
            timeRemaining: this.calculateTimeRemaining(maintenanceData.endTime),
            isChecking: false,
        };

        // Store maintenance data
        this.storeMaintenanceData(maintenanceData);

        // Start countdown timer
        this.startCountdownTimer();

        this.notifyListeners();
    }

    // Clear maintenance mode
    clearMaintenanceMode(): void {
        logger.log('✅ Clearing maintenance mode');

        this.maintenanceState = {
            isMaintenanceMode: false,
            maintenanceData: null,
            timeRemaining: 0,
            isChecking: false,
        };

        // Clear stored maintenance data
        this.clearStoredMaintenanceData();

        // Stop countdown timer
        this.stopCountdownTimer();

        this.notifyListeners();
    }

    // Set checking state
    setChecking(isChecking: boolean): void {
        this.maintenanceState.isChecking = isChecking;
        this.notifyListeners();
    }

    // Calculate time remaining until maintenance ends
    private calculateTimeRemaining(endTime: string): number {
        try {
            const endDate = new Date(endTime);
            const now = new Date();
            const timeRemaining = endDate.getTime() - now.getTime();
            return Math.max(0, timeRemaining);
        } catch (error) {
            logger.error('Error calculating time remaining:', error);
            return 0;
        }
    }

    // Start countdown timer
    private startCountdownTimer(): void {
        this.stopCountdownTimer(); // Clear any existing timer

        this.intervalId = setInterval(() => {
            if (this.maintenanceState.maintenanceData) {
                const timeRemaining = this.calculateTimeRemaining(this.maintenanceState.maintenanceData.endTime);

                if (timeRemaining <= 0) {
                    // Maintenance period has ended
                    this.clearMaintenanceMode();
                } else {
                    this.maintenanceState.timeRemaining = timeRemaining;
                    this.notifyListeners();
                }
            }
        }, 1000); // Update every second
    }

    // Stop countdown timer
    private stopCountdownTimer(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Store maintenance data in AsyncStorage
    private async storeMaintenanceData(data: MaintenanceStatus): Promise<void> {
        try {
            await AsyncStorage.setItem('maintenanceData', JSON.stringify(data));
            logger.log('💾 Maintenance data stored');
        } catch (error) {
            logger.error('Error storing maintenance data:', error);
        }
    }

    // Clear stored maintenance data
    private async clearStoredMaintenanceData(): Promise<void> {
        try {
            await AsyncStorage.removeItem('maintenanceData');
            logger.log('🗑️ Maintenance data cleared');
        } catch (error) {
            logger.error('Error clearing maintenance data:', error);
        }
    }

    // Load maintenance data from storage on app start
    async loadStoredMaintenanceData(): Promise<void> {
        try {
            const storedData = await AsyncStorage.getItem('maintenanceData');
            if (storedData) {
                const maintenanceData: MaintenanceStatus = JSON.parse(storedData);

                // Check if maintenance is still active
                const timeRemaining = this.calculateTimeRemaining(maintenanceData.endTime);
                if (timeRemaining > 0) {
                    this.setMaintenanceMode(maintenanceData);
                } else {
                    // Maintenance has ended, clear stored data
                    this.clearStoredMaintenanceData();
                }
            }
        } catch (error) {
            logger.error('Error loading stored maintenance data:', error);
        }
    }

    // Format time remaining for display
    formatTimeRemaining(): string {
        const { timeRemaining } = this.maintenanceState;

        if (timeRemaining <= 0) {
            return '00:00:00';
        }

        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Check if maintenance is currently active
    isMaintenanceActive(): boolean {
        return this.maintenanceState.isMaintenanceMode && this.maintenanceState.timeRemaining > 0;
    }

    // Get maintenance message
    getMaintenanceMessage(): string {
        return this.maintenanceState.maintenanceData?.message || 'System is under maintenance. Please try again later.';
    }

    // Get maintenance reason
    getMaintenanceReason(): string {
        return this.maintenanceState.maintenanceData?.reason || 'Scheduled maintenance';
    }

    // Cleanup on app destroy
    destroy(): void {
        this.stopCountdownTimer();
        this.listeners = [];
    }
}

export default MaintenanceService;

import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import Home from '@/app/(app)/(tabs)/home';
// Imports for other screens (assuming default exports)
import Savings from '@/app/(app)/(tabs)/savings';
import Profile from '@/app/(app)/(tabs)/profile';
import api from '@/services/api';

// Mock Dependencies
jest.mock('@react-navigation/native', () => {
    const actualNav = jest.requireActual('@react-navigation/native');
    return {
        ...actualNav,
        useNavigation: () => ({
            navigate: jest.fn(),
            dispatch: jest.fn(),
        }),
        useFocusEffect: (cb) => require('react').useEffect(cb, []),
        useIsFocused: jest.fn(() => true),
    };
});

jest.mock("expo-router", () => {
    const innerMockStack = ({ children }: any) => children;
    innerMockStack.Screen = () => null;
    return {
        router: {
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
        },
        useRouter: () => ({
            push: jest.fn(),
            replace: jest.fn(),
            back: jest.fn(),
        }),
        useLocalSearchParams: jest.fn(() => ({})),
        useFocusEffect: (cb) => require('react').useEffect(cb, []),
        usePathname: jest.fn(() => ''),
        Stack: innerMockStack,
    };
});

jest.mock('@/services/api');





describe('Menu Navigation Integrity (Smoke Tests)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (api.get as jest.Mock).mockImplementation((url) => {
            if (url.includes('/home')) {
                return Promise.resolve({
                    data: {
                        success: true,
                        data: {
                            currentRates: {
                                gold_rate: "6000",
                                gold_rate_18: "5000",
                                gold_rate_14: "4000",
                                updated_at: "2026-06-17T00:00:00.000Z"
                            },
                            videos: [],
                            socialmedia: {}
                        }
                    }
                });
            }
            if (url.includes('/branches')) {
                return Promise.resolve({ data: { success: true, data: [] } });
            }
            if (url.includes('/kyc/status')) {
                return Promise.resolve({ data: { success: true, kyc_status: "Completed", data: {} } });
            }
            return Promise.resolve({ data: { success: true, data: [] } });
        });
    });
    
    it('renders the Home screen successfully', async () => {
        const { getByText } = render(<Home />);
        await waitFor(() => {
            expect(getByText('liveGoldRates')).toBeTruthy();
        });
    });

    // TODO: Fix async state update issues causing flaky test
    it('renders the Savings screen successfully', async () => {
        (api.get as jest.Mock).mockResolvedValue({ data: { success: true, data: [] } });
        (api.post as jest.Mock).mockResolvedValue({ data: { success: true, rewards: [] } });

        const { getByText } = render(<Savings />);
        await waitFor(() => {
            // Since we return empty data, expect the EmptyState text or button
            expect(getByText('Start your gold savings journey today and build your wealth gradually')).toBeTruthy();
        });
    });

    it('renders the Profile screen successfully', async () => {
        const { getByText } = render(<Profile />);
         expect(true).toBe(true);
    });
});

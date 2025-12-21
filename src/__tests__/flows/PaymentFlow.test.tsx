import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EnhancedSchemeCard from '@/app/(app)/(tabs)/savings/EnhancedSchemeCard';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import useGlobalStore from '@/store/global.store';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/services/api');

// Mock Store
const mockUser = {
  id: 'user-123',
  name: 'Test User',
  mobile: '1234567890',
  email: 'test@example.com',
};

// Setup store mock
const mockStore = useGlobalStore as unknown as jest.Mock;
mockStore.mockReturnValue({
  user: mockUser,
  isLoggedIn: true,
});

describe('E2E Payment Flow: My Schemes -> Pay Now', () => {
    let mockPush: jest.Mock;
    
    // Test Data
    const mockScheme = {
        id: 'scheme-001',
        schemeName: 'Gold Savings Plan',
        schemeType: 'weight',
        accountNo: 'ACC-999',
        totalInstallments: 11, // Example: 11 paid
        pendingInstallments: 1, 
        monthsPaid: 1,
        emiAmount: 5000,
        maturityDate: '2025-05-01',
        goldWeight: 10.5,
        accountHolder: 'Test User',
        accNo: '123456789',
        payableAmount: 5000,
        status: 'active',
        schemesData: {
            paymentFrequencyName: 'Monthly',
            schemeTypeName: 'Gold',
            schemeType: 'weight',
        },
        // Add other necessary fields expected by the component
    } as any;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup Router Mock
        mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });

        // Setup API Mock for Payment Check
        (api.post as jest.Mock).mockResolvedValue({
            data: {
                success: true,
                message: "Payment check successful"
            }
        });
    });

    it('navigates to Payment Overview when "Pay Now" is clicked', async () => {
        // 1. Render Component
        const { getByText, getByTestId } = render(
            <EnhancedSchemeCard item={mockScheme} translations={{ payNow: 'Pay Now' }} />
        );

        // 2. Find "Pay Now" button
        // Note: You might need to add testID="pay-now-button" to the component if text search is flaky
        const payButton = getByText('Pay Now'); 

        // 3. Simulate User Interaction
        fireEvent.press(payButton);

        // 4. Verify API Call
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith(
                "investments/check-payment",
                expect.objectContaining({
                    userId: mockUser.id,
                    investmentId: mockScheme.id
                })
            );
        });

        // 5. Verify Navigation
        expect(mockPush).toHaveBeenCalledWith({
            pathname: "/(app)/(tabs)/home/paymentNewOverView",
            params: expect.objectContaining({
                amount: '5000',
                schemeName: 'Gold Savings Plan',
                // userDetails is passed as a stringified JSON
                userDetails: expect.any(String),
            })
        });
    });
});

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import OfflineBanner from '../../components/OfflineBanner';

describe('OfflineBanner Component', () => {
  let netInfoListener: ((state: any) => void) | null = null;

  beforeEach(() => {
    (NetInfo.addEventListener as jest.Mock).mockImplementation((listener) => {
      netInfoListener = listener;
      return jest.fn();
    });
  });

  test('does not render banner when network is connected', () => {
    const { queryByText } = render(<OfflineBanner />);

    // Trigger online event
    act(() => {
      if (netInfoListener) {
        netInfoListener({ isConnected: true, isInternetReachable: true });
      }
    });

    expect(queryByText(/Offline Mode/i)).toBeNull();
  });

  test('renders banner when network is disconnected and allows dismissal', () => {
    const { getByText, queryByText, UNSAFE_getByType } = render(<OfflineBanner />);

    // Trigger offline event
    act(() => {
      if (netInfoListener) {
        netInfoListener({ isConnected: false, isInternetReachable: false });
      }
    });

    expect(getByText(/Offline Mode • Showing cached data/i)).toBeTruthy();

    // Find and press close touchable
    const { TouchableOpacity } = require('react-native');
    const closeBtn = UNSAFE_getByType(TouchableOpacity);
    act(() => {
      fireEvent.press(closeBtn);
    });

    // After dismiss, banner should be hidden
    expect(queryByText(/Offline Mode/i)).toBeNull();
  });
});

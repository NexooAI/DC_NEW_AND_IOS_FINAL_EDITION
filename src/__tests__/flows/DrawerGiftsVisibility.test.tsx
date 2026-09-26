import React from 'react';
import { render } from '@testing-library/react-native';
import CustomDrawerContent from '@/common/components/navigation/DrawerContent';
import * as visibilityHook from '@/hooks/useAppVisibility';

// Mock Dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    dispatch: jest.fn(),
  }),
  useFocusEffect: (cb: any) => require('react').useEffect(cb, []),
  useIsFocused: jest.fn(() => true),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: jest.fn(() => '/home'),
  useNavigation: () => ({
    closeDrawer: jest.fn(),
  }),
}));

describe('Drawer Gifts Visibility Tests', () => {
  const mockNavigation = {
    closeDrawer: jest.fn(),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders Gifts menu item when both showSideGifts and showGifts are enabled', () => {
    jest.spyOn(visibilityHook, 'useAppVisibility').mockReturnValue({
      isVisible: ((key: string) => {
        if (key === 'showSideGifts' || key === 'showGifts') return true;
        return true;
      }) as any,
      isLoading: false,
      error: null,
      fetchVisibilityData: jest.fn(),
      visibleData: {} as any,
    });

    const { queryByText } = render(<CustomDrawerContent navigation={mockNavigation} />);
    expect(queryByText(/Gifts/i)).toBeTruthy();
  });

  it('hides Gifts menu item when showSideGifts is disabled (0)', () => {
    jest.spyOn(visibilityHook, 'useAppVisibility').mockReturnValue({
      isVisible: ((key: string) => {
        if (key === 'showSideGifts') return false;
        return true;
      }) as any,
      isLoading: false,
      error: null,
      fetchVisibilityData: jest.fn(),
      visibleData: {} as any,
    });

    const { queryByText } = render(<CustomDrawerContent navigation={mockNavigation} />);
    expect(queryByText(/Gifts/i)).toBeNull();
  });

  it('hides Gifts menu item when showGifts is disabled (0)', () => {
    jest.spyOn(visibilityHook, 'useAppVisibility').mockReturnValue({
      isVisible: ((key: string) => {
        if (key === 'showGifts') return false;
        return true;
      }) as any,
      isLoading: false,
      error: null,
      fetchVisibilityData: jest.fn(),
      visibleData: {} as any,
    });

    const { queryByText } = render(<CustomDrawerContent navigation={mockNavigation} />);
    expect(queryByText(/Gifts/i)).toBeNull();
  });
});

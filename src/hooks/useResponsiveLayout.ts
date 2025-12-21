import { useState, useEffect } from 'react';
import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';
import { theme } from '../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro - 375x812)
const baseWidth = 375;
const baseHeight = 812;

// Enhanced screen size breakpoints for better device coverage
const breakpoints = {
  tiny: 320,     // iPhone SE (1st gen), very small Android
  small: 375,    // iPhone SE (2nd gen), iPhone 12/13 mini
  medium: 414,   // iPhone 11 Pro Max, most Android phones
  large: 428,    // iPhone 14 Pro Max, large Android phones
  xlarge: 500,   // Small tablets, foldable phones
  tablet: 768,   // iPad, Android tablets
  largeTablet: 1024, // Large tablets
};

// Device type detection
const getDeviceType = (width: number, height: number) => {
  const aspectRatio = width / height;

  if (width >= breakpoints.largeTablet) return 'largeTablet';
  if (width >= breakpoints.tablet) return 'tablet';
  if (width >= breakpoints.xlarge) return 'xlarge';
  if (width >= breakpoints.large) return 'large';
  if (width >= breakpoints.medium) return 'medium';
  if (width >= breakpoints.small) return 'small';
  return 'tiny';
};

// Orientation detection
const getOrientation = (width: number, height: number) => {
  return width > height ? 'landscape' : 'portrait';
};

export const useResponsiveLayout = () => {
  const [dimensions, setDimensions] = useState({
    width: screenWidth,
    height: screenHeight,
  });

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    getOrientation(screenWidth, screenHeight)
  );

  const [deviceType, setDeviceType] = useState(getDeviceType(screenWidth, screenHeight));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      const newDimensions = {
        width: window.width,
        height: window.height,
      };

      setDimensions(newDimensions);
      setOrientation(getOrientation(window.width, window.height));
      setDeviceType(getDeviceType(window.width, window.height));
    });

    return () => subscription?.remove();
  }, []);

  // Enhanced responsive scaling functions
  const scale = (size: number) => {
    const newSize = size * (dimensions.width / baseWidth);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const verticalScale = (size: number) => {
    const newSize = size * (dimensions.height / baseHeight);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  const moderateScale = (size: number, factor = 0.5) => {
    const newSize = size + (scale(size) - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  // Device-specific scaling - Balanced for better control
  const deviceScale = (size: number, deviceFactor = 1) => {
    let factor = deviceFactor;

    switch (deviceType) {
      case 'tiny':
        factor *= 0.9; // Balanced for smaller screens
        break;
      case 'small':
        factor *= 1.0; // Standard size
        break;
      case 'medium':
        factor *= 1.1; // Slightly larger
        break;
      case 'large':
        factor *= 1.2; // Larger for big screens
        break;
      case 'xlarge':
        factor *= 1.3; // Balanced for large screens
        break;
      case 'tablet':
        factor *= 1.4; // Balanced for tablets
        break;
      case 'largeTablet':
        factor *= 1.6; // Balanced for large tablets
        break;
    }

    return Math.round(PixelRatio.roundToNearestPixel(size * factor));
  };

  // Screen size detection with enhanced coverage
  const isTinyScreen = dimensions.width <= breakpoints.tiny;
  const isSmallScreen = dimensions.width > breakpoints.tiny && dimensions.width <= breakpoints.small;
  const isMediumScreen = dimensions.width > breakpoints.small && dimensions.width <= breakpoints.medium;
  const isLargeScreen = dimensions.width > breakpoints.medium && dimensions.width <= breakpoints.large;
  const isXLargeScreen = dimensions.width > breakpoints.large && dimensions.width <= breakpoints.xlarge;
  const isTablet = dimensions.width >= breakpoints.tablet;
  const isLargeTablet = dimensions.width >= breakpoints.largeTablet;

  // Orientation detection
  const isPortrait = orientation === 'portrait';
  const isLandscape = orientation === 'landscape';

  // Responsive spacing with device optimization
  const spacing = {
    xs: deviceScale(4),
    sm: deviceScale(8),
    md: deviceScale(16),
    lg: deviceScale(24),
    xl: deviceScale(32),
    xxl: deviceScale(48),
  };

  // Responsive font sizes with device optimization - Balanced for readability
  const fontSize = {
    xs: deviceScale(12),
    sm: deviceScale(14),
    md: deviceScale(16),
    lg: deviceScale(18),
    xl: deviceScale(20),
    xxl: deviceScale(24),
    xxxl: deviceScale(28),
    display: deviceScale(32),
    displayLarge: deviceScale(40),
  };

  // Responsive border radius
  const borderRadius = {
    sm: deviceScale(4),
    md: deviceScale(8),
    lg: deviceScale(12),
    xl: deviceScale(16),
    xxl: deviceScale(24),
    round: deviceScale(50),
  };

  // Responsive padding/margin
  const padding = {
    xs: deviceScale(4),
    sm: deviceScale(8),
    md: deviceScale(12),
    lg: deviceScale(16),
    xl: deviceScale(20),
    xxl: deviceScale(24),
    xxxl: deviceScale(32),
  };

  // Enhanced responsive shadows
  const shadows = {
    small: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: deviceScale(1) },
      shadowOpacity: 0.1,
      shadowRadius: deviceScale(2),
      elevation: deviceScale(2),
    },
    medium: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: deviceScale(2) },
      shadowOpacity: 0.15,
      shadowRadius: deviceScale(4),
      elevation: deviceScale(4),
    },
    large: {
      shadowColor: theme.colors.shadowBlack,
      shadowOffset: { width: 0, height: deviceScale(4) },
      shadowOpacity: 0.2,
      shadowRadius: deviceScale(8),
      elevation: deviceScale(8),
    },
  };

  // Safe area calculations with device optimization
  const safeAreaTop = Platform.OS === 'ios' ? (isTablet ? 20 : 44) : 24;
  const safeAreaBottom = Platform.OS === 'ios' ? (isTablet ? 20 : 34) : 0;
  const headerHeight = safeAreaTop + deviceScale(60); // Responsive header height
  const bottomBarHeight = deviceScale(80) + safeAreaBottom; // Responsive bottom bar height

  // Enhanced responsive utilities
  const getResponsiveFontSize = (...sizes: number[]) => {
    if (isTinyScreen) return sizes[0] || sizes[1] || sizes[2];
    if (isSmallScreen) return sizes[1] || sizes[2] || sizes[0];
    if (isMediumScreen) return sizes[2] || sizes[1] || sizes[0];
    if (isLargeScreen) return sizes[2] || sizes[1] || sizes[0];
    if (isXLargeScreen) return sizes[2] || sizes[1] || sizes[0];
    if (isTablet) return sizes[2] || sizes[1] || sizes[0];
    return sizes[2] || sizes[1] || sizes[0];
  };

  const getResponsivePadding = (...paddings: number[]) => {
    if (isTinyScreen) return paddings[0] || paddings[1] || paddings[2];
    if (isSmallScreen) return paddings[1] || paddings[2] || paddings[0];
    if (isMediumScreen) return paddings[2] || paddings[1] || paddings[0];
    if (isLargeScreen) return paddings[2] || paddings[1] || paddings[0];
    if (isXLargeScreen) return paddings[2] || paddings[1] || paddings[0];
    if (isTablet) return paddings[2] || paddings[1] || paddings[0];
    return paddings[2] || paddings[1] || paddings[0];
  };

  const getResponsiveWidth = (percentage: number) => {
    return (dimensions.width * percentage) / 100;
  };

  const getResponsiveHeight = (percentage: number) => {
    return (dimensions.height * percentage) / 100;
  };

  // Device-specific layout helpers
  const getDeviceSpecificSpacing = (baseSpacing: number) => {
    return deviceScale(baseSpacing);
  };

  const getOrientationSpecificLayout = (portraitValue: any, landscapeValue: any) => {
    return isPortrait ? portraitValue : landscapeValue;
  };

  // Component-specific responsive helpers
  const getCardWidth = () => {
    if (isTablet) return getResponsiveWidth(45); // 2 columns on tablet
    if (isXLargeScreen) return getResponsiveWidth(85); // Almost full width
    return getResponsiveWidth(90); // Full width on phones
  };

  const getGridColumns = () => {
    if (isLargeTablet) return 3;
    if (isTablet) return 2;
    return 1;
  };

  const getListItemHeight = () => {
    if (isTablet) return deviceScale(80);
    if (isXLargeScreen) return deviceScale(70);
    return deviceScale(60);
  };

  return {
    // Dimensions
    screenWidth: dimensions.width,
    screenHeight: dimensions.height,

    // Device information
    deviceType,
    orientation,
    isPortrait,
    isLandscape,

    // Safe areas
    safeAreaTop,
    safeAreaBottom,
    headerHeight,
    bottomBarHeight,

    // Screen size flags
    isTinyScreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    isXLargeScreen,
    isTablet,
    isLargeTablet,

    // Responsive utilities
    scale,
    verticalScale,
    moderateScale,
    deviceScale,
    getResponsiveFontSize,
    getResponsivePadding,
    getResponsiveWidth,
    getResponsiveHeight,
    getDeviceSpecificSpacing,
    getOrientationSpecificLayout,

    // Component-specific helpers
    getCardWidth,
    getGridColumns,
    getListItemHeight,

    // Predefined responsive values
    spacing,
    fontSize,
    borderRadius,
    padding,
    shadows,
  };
}; 
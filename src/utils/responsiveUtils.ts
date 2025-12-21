import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Base dimensions for scaling
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size breakpoints
export const BREAKPOINTS = {
    tiny: 320,     // iPhone SE (1st gen), very small Android
    small: 375,    // iPhone SE (2nd gen), iPhone 12/13 mini
    medium: 414,   // iPhone 11 Pro Max, most Android phones
    large: 428,    // iPhone 14 Pro Max, large Android phones
    xlarge: 500,   // Small tablets, foldable phones
    tablet: 768,   // iPad, Android tablets
    largeTablet: 1024, // Large tablets
};

// Responsive width percentage
export const wp = (percentage: number): number => {
    return (screenWidth * percentage) / 100;
};

// Responsive height percentage
export const hp = (percentage: number): number => {
    return (screenHeight * percentage) / 100;
};

// Responsive font size with device scaling
export const rf = (size: number, options?: {
    minSize?: number;
    maxSize?: number;
    allowFontScaling?: boolean;
}): number => {
    const { minSize, maxSize, allowFontScaling = true } = options || {};

    // Calculate scale factor based on screen width
    const scale = screenWidth / BASE_WIDTH;

    // Apply device-specific scaling
    const deviceType = getDeviceType(screenWidth);
    let deviceScale = 1;

    switch (deviceType) {
        case 'tiny':
            deviceScale = 0.9;
            break;
        case 'small':
            deviceScale = 0.95;
            break;
        case 'medium':
            deviceScale = 1.0;
            break;
        case 'large':
            deviceScale = 1.05;
            break;
        case 'xlarge':
            deviceScale = 1.1;
            break;
        case 'tablet':
            deviceScale = 1.2;
            break;
        case 'largeTablet':
            deviceScale = 1.3;
            break;
    }

    // Calculate final size
    let finalSize = size * scale * deviceScale;

    // Apply min/max constraints
    if (minSize && finalSize < minSize) finalSize = minSize;
    if (maxSize && finalSize > maxSize) finalSize = maxSize;

    // Round to nearest pixel
    return Math.round(PixelRatio.roundToNearestPixel(finalSize));
};

// Device type detection
export const getDeviceType = (width: number): string => {
    if (width >= BREAKPOINTS.largeTablet) return 'largeTablet';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    if (width >= BREAKPOINTS.xlarge) return 'xlarge';
    if (width >= BREAKPOINTS.large) return 'large';
    if (width >= BREAKPOINTS.medium) return 'medium';
    if (width >= BREAKPOINTS.small) return 'small';
    return 'tiny';
};

// Responsive padding
export const rp = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel((screenWidth * size) / BASE_WIDTH));
};

// Responsive margin
export const rm = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel((screenWidth * size) / BASE_WIDTH));
};

// Responsive border radius
export const rb = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel((screenWidth * size) / BASE_WIDTH));
};

// Check if device is small screen
export const isSmallDevice = (): boolean => {
    return screenWidth <= BREAKPOINTS.small;
};

// Check if device is tablet
export const isTabletDevice = (): boolean => {
    return screenWidth >= BREAKPOINTS.tablet;
};

// Check if device is large screen
export const isLargeDevice = (): boolean => {
    return screenWidth >= BREAKPOINTS.large;
};

// Get responsive dimensions for images
export const getImageDimensions = (baseWidth: number, baseHeight: number, maxWidth?: number) => {
    const aspectRatio = baseHeight / baseWidth;
    const maxW = maxWidth || screenWidth * 0.9;
    const responsiveWidth = Math.min(baseWidth, maxW);
    const responsiveHeight = responsiveWidth * aspectRatio;

    return {
        width: Math.round(responsiveWidth),
        height: Math.round(responsiveHeight),
    };
};

// Get responsive grid columns
export const getGridColumns = (): number => {
    if (screenWidth >= BREAKPOINTS.largeTablet) return 3;
    if (screenWidth >= BREAKPOINTS.tablet) return 2;
    return 1;
};

// Get responsive card width
export const getCardWidth = (columns: number = 1): number => {
    const padding = rp(16) * 2; // Left and right padding
    const margin = rp(8) * (columns - 1); // Margins between cards
    return (screenWidth - padding - margin) / columns;
};

// Get responsive list item height
export const getListItemHeight = (): number => {
    if (screenWidth >= BREAKPOINTS.tablet) return rp(80);
    if (screenWidth >= BREAKPOINTS.large) return rp(70);
    return rp(60);
};

// Get responsive button height
export const getButtonHeight = (size: 'small' | 'medium' | 'large' = 'medium'): number => {
    switch (size) {
        case 'small':
            return rp(36);
        case 'large':
            return rp(52);
        default:
            return rp(44);
    }
};

// Get responsive input height
export const getInputHeight = (): number => {
    return rp(48);
};

// Get responsive header height
export const getHeaderHeight = (): number => {
    const statusBarHeight = Platform.OS === 'ios' ? 44 : 24;
    return statusBarHeight + rp(56);
};

// Get responsive bottom tab height
export const getBottomTabHeight = (): number => {
    const safeAreaBottom = Platform.OS === 'ios' ? 34 : 0;
    return rp(60) + safeAreaBottom;
};

// Get responsive spacing
export const getSpacing = (multiplier: number = 1): number => {
    return rp(8 * multiplier);
};

// Get responsive font sizes for different text types
export const getFontSizes = () => ({
    h1: rf(32, { minSize: 24, maxSize: 40 }),
    h2: rf(28, { minSize: 20, maxSize: 36 }),
    h3: rf(24, { minSize: 18, maxSize: 32 }),
    h4: rf(20, { minSize: 16, maxSize: 28 }),
    h5: rf(18, { minSize: 14, maxSize: 24 }),
    h6: rf(16, { minSize: 12, maxSize: 20 }),
    body: rf(16, { minSize: 12, maxSize: 20 }),
    bodySmall: rf(14, { minSize: 10, maxSize: 18 }),
    bodyLarge: rf(18, { minSize: 14, maxSize: 24 }),
    caption: rf(12, { minSize: 10, maxSize: 16 }),
    label: rf(14, { minSize: 12, maxSize: 18 }),
    button: rf(14, { minSize: 12, maxSize: 16 }),
    buttonSmall: rf(12, { minSize: 10, maxSize: 14 }),
    buttonLarge: rf(16, { minSize: 14, maxSize: 18 }),
});

// Get responsive shadows
export const getShadows = () => ({
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(1) },
        shadowOpacity: 0.1,
        shadowRadius: rp(2),
        elevation: rp(2),
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.15,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(4) },
        shadowOpacity: 0.2,
        shadowRadius: rp(8),
        elevation: rp(8),
    },
});

// Get responsive border radius
export const getBorderRadius = () => ({
    small: rb(4),
    medium: rb(8),
    large: rb(12),
    xlarge: rb(16),
    round: rb(50),
});

// Get responsive padding/margin
export const getSpacingValues = () => ({
    xs: rp(4),
    sm: rp(8),
    md: rp(12),
    lg: rp(16),
    xl: rp(20),
    xxl: rp(24),
    xxxl: rp(32),
});

// Text truncation utilities
export const getTextTruncation = () => ({
    singleLine: {
        numberOfLines: 1,
        ellipsizeMode: 'tail' as const,
    },
    twoLines: {
        numberOfLines: 2,
        ellipsizeMode: 'tail' as const,
    },
    threeLines: {
        numberOfLines: 3,
        ellipsizeMode: 'tail' as const,
    },
    wrap: {
        flexWrap: 'wrap' as const,
    },
});

// Flex utilities for responsive layouts
export const getFlexUtils = () => ({
    shrinkInRow: {
        flexShrink: 1,
        flex: 0,
    },
    expand: {
        flex: 1,
    },
    wrapContainer: {
        flexWrap: 'wrap' as const,
        flexDirection: 'row' as const,
    },
});

// Common responsive styles
export const getCommonStyles = () => ({
    container: {
        flex: 1,
        paddingHorizontal: rp(16),
    },
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    column: {
        flexDirection: 'column' as const,
    },
    center: {
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    spaceBetween: {
        justifyContent: 'space-between' as const,
    },
    spaceAround: {
        justifyContent: 'space-around' as const,
    },
    spaceEvenly: {
        justifyContent: 'space-evenly' as const,
    },
    flexStart: {
        justifyContent: 'flex-start' as const,
    },
    flexEnd: {
        justifyContent: 'flex-end' as const,
    },
    alignStart: {
        alignItems: 'flex-start' as const,
    },
    alignEnd: {
        alignItems: 'flex-end' as const,
    },
    alignCenter: {
        alignItems: 'center' as const,
    },
    alignStretch: {
        alignItems: 'stretch' as const,
    },
});

// Safe area utilities
export const getSafeAreaInsets = () => {
    const statusBarHeight = Platform.OS === 'ios' ? 44 : 24;
    const bottomSafeArea = Platform.OS === 'ios' ? 34 : 0;

    return {
        top: statusBarHeight,
        bottom: bottomSafeArea,
        left: 0,
        right: 0,
    };
};

// Keyboard avoiding utilities
export const getKeyboardAvoidingBehavior = () => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
};

// Platform-specific utilities
export const getPlatformUtils = () => ({
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    select: Platform.select,
    keyboardAvoidingBehavior: getKeyboardAvoidingBehavior(),
});

// Export all utilities as a single object
export const responsiveUtils = {
    // Dimensions
    wp,
    hp,
    rf,
    rp,
    rm,
    rb,

    // Device detection
    isSmallDevice,
    isTabletDevice,
    isLargeDevice,
    getDeviceType,

    // Layout helpers
    getImageDimensions,
    getGridColumns,
    getCardWidth,
    getListItemHeight,
    getButtonHeight,
    getInputHeight,
    getHeaderHeight,
    getBottomTabHeight,
    getSpacing,

    // Style helpers
    getFontSizes,
    getShadows,
    getBorderRadius,
    getSpacingValues,
    getTextTruncation,
    getFlexUtils,
    getCommonStyles,
    getSafeAreaInsets,
    getPlatformUtils,

    // Constants
    BREAKPOINTS,
    screenWidth,
    screenHeight,
};

export default responsiveUtils;

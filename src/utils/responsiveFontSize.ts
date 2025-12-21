import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro - 375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size breakpoints
const BREAKPOINTS = {
    tiny: 320,     // iPhone SE (1st gen), very small Android
    small: 375,    // iPhone SE (2nd gen), iPhone 12/13 mini
    medium: 414,   // iPhone 11 Pro Max, most Android phones
    large: 428,    // iPhone 14 Pro Max, large Android phones
    xlarge: 500,   // Small tablets, foldable phones
    tablet: 768,   // iPad, Android tablets
    largeTablet: 1024, // Large tablets
};

// Device type detection
const getDeviceType = (width: number) => {
    if (width >= BREAKPOINTS.largeTablet) return 'largeTablet';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    if (width >= BREAKPOINTS.xlarge) return 'xlarge';
    if (width >= BREAKPOINTS.large) return 'large';
    if (width >= BREAKPOINTS.medium) return 'medium';
    if (width >= BREAKPOINTS.small) return 'small';
    return 'tiny';
};

// Responsive font scaling function
export const responsiveFontSize = (size: number, options?: {
    minSize?: number;
    maxSize?: number;
    allowFontScaling?: boolean;
}) => {
    const { minSize, maxSize, allowFontScaling = true } = options || {};

    // Calculate scale factor based on screen width
    const scale = SCREEN_WIDTH / BASE_WIDTH;

    // Apply device-specific scaling
    const deviceType = getDeviceType(SCREEN_WIDTH);
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

// Predefined font sizes for common use cases
export const FONT_SIZES = {
    // Headers
    h1: () => responsiveFontSize(32, { minSize: 24, maxSize: 40 }),
    h2: () => responsiveFontSize(28, { minSize: 20, maxSize: 36 }),
    h3: () => responsiveFontSize(24, { minSize: 18, maxSize: 32 }),
    h4: () => responsiveFontSize(20, { minSize: 16, maxSize: 28 }),
    h5: () => responsiveFontSize(18, { minSize: 14, maxSize: 24 }),
    h6: () => responsiveFontSize(16, { minSize: 12, maxSize: 20 }),

    // Body text
    body: () => responsiveFontSize(16, { minSize: 12, maxSize: 20 }),
    bodySmall: () => responsiveFontSize(14, { minSize: 10, maxSize: 18 }),
    bodyLarge: () => responsiveFontSize(18, { minSize: 14, maxSize: 24 }),

    // Captions and labels
    caption: () => responsiveFontSize(12, { minSize: 10, maxSize: 16 }),
    label: () => responsiveFontSize(14, { minSize: 12, maxSize: 18 }),

    // Buttons
    button: () => responsiveFontSize(14, { minSize: 12, maxSize: 16 }),
    buttonSmall: () => responsiveFontSize(12, { minSize: 10, maxSize: 14 }),
    buttonLarge: () => responsiveFontSize(16, { minSize: 14, maxSize: 18 }),

    // Special cases
    tiny: () => responsiveFontSize(10, { minSize: 8, maxSize: 14 }),
    small: () => responsiveFontSize(12, { minSize: 10, maxSize: 16 }),
    medium: () => responsiveFontSize(16, { minSize: 14, maxSize: 20 }),
    large: () => responsiveFontSize(20, { minSize: 16, maxSize: 28 }),
    xlarge: () => responsiveFontSize(24, { minSize: 20, maxSize: 32 }),
    xxlarge: () => responsiveFontSize(28, { minSize: 24, maxSize: 36 }),
};

// Text truncation utilities
export const TEXT_TRUNCATION = {
    // For single line text that should truncate with ellipsis
    singleLine: {
        numberOfLines: 1,
        ellipsizeMode: 'tail' as const,
    },

    // For two line text that should truncate with ellipsis
    twoLines: {
        numberOfLines: 2,
        ellipsizeMode: 'tail' as const,
    },

    // For three line text that should truncate with ellipsis
    threeLines: {
        numberOfLines: 3,
        ellipsizeMode: 'tail' as const,
    },

    // For text that should wrap without truncation
    wrap: {
        flexWrap: 'wrap' as const,
    },
};

// Flex utilities for text containers
export const FLEX_UTILS = {
    // For text in row layouts that should shrink
    shrinkInRow: {
        flexShrink: 1,
        flex: 0,
    },

    // For text that should take available space
    expand: {
        flex: 1,
    },

    // For text containers that should wrap
    wrapContainer: {
        flexWrap: 'wrap' as const,
        flexDirection: 'row' as const,
    },
};

// Common text styles that prevent truncation
export const TEXT_STYLES = {
    // Base text style with responsive font size
    base: (fontSize: number = 16) => ({
        fontSize: responsiveFontSize(fontSize),
        ...TEXT_TRUNCATION.wrap,
    }),

    // Single line text with ellipsis
    singleLine: (fontSize: number = 16) => ({
        fontSize: responsiveFontSize(fontSize),
        ...TEXT_TRUNCATION.singleLine,
    }),

    // Two line text with ellipsis
    twoLines: (fontSize: number = 16) => ({
        fontSize: responsiveFontSize(fontSize),
        ...TEXT_TRUNCATION.twoLines,
    }),

    // Text in row layout that should shrink
    rowText: (fontSize: number = 16) => ({
        fontSize: responsiveFontSize(fontSize),
        ...FLEX_UTILS.shrinkInRow,
    }),

    // Button text style
    button: (fontSize: number = 16) => ({
        fontSize: responsiveFontSize(fontSize, { minSize: 14, maxSize: 20 }),
        textAlign: 'center' as const,
        ...TEXT_TRUNCATION.singleLine,
    }),
};

export default responsiveFontSize;

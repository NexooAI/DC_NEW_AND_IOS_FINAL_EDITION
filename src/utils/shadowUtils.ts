import { Platform } from 'react-native';
import { responsiveUtils } from './responsiveUtils';

const { rp } = responsiveUtils;

// Shadow configuration interface
interface ShadowConfig {
    shadowColor: string;
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation?: number; // Android only
}

// Predefined shadow presets
export const SHADOW_PRESETS = {
    none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    tiny: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(1) },
        shadowOpacity: 0.05,
        shadowRadius: rp(1),
        elevation: rp(1),
    },
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
    xlarge: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(6) },
        shadowOpacity: 0.25,
        shadowRadius: rp(12),
        elevation: rp(12),
    },
    xxlarge: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: rp(8) },
        shadowOpacity: 0.3,
        shadowRadius: rp(16),
        elevation: rp(16),
    },
};

// Component-specific shadows
export const COMPONENT_SHADOWS = {
    card: SHADOW_PRESETS.small,
    cardHover: SHADOW_PRESETS.medium,
    button: SHADOW_PRESETS.tiny,
    buttonPressed: SHADOW_PRESETS.none,
    modal: SHADOW_PRESETS.large,
    dropdown: SHADOW_PRESETS.medium,
    header: SHADOW_PRESETS.small,
    bottomSheet: SHADOW_PRESETS.large,
    floatingButton: SHADOW_PRESETS.medium,
    input: SHADOW_PRESETS.tiny,
    inputFocused: SHADOW_PRESETS.small,
    tabBar: SHADOW_PRESETS.small,
    drawer: SHADOW_PRESETS.large,
    tooltip: SHADOW_PRESETS.small,
    badge: SHADOW_PRESETS.tiny,
    chip: SHADOW_PRESETS.tiny,
    avatar: SHADOW_PRESETS.small,
    image: SHADOW_PRESETS.tiny,
    divider: SHADOW_PRESETS.none,
};

// Color-specific shadows
export const COLOR_SHADOWS = {
    primary: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    secondary: {
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    success: {
        shadowColor: '#34C759',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    warning: {
        shadowColor: '#FF9500',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    error: {
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    gold: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.3,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
    silver: {
        shadowColor: '#C0C0C0',
        shadowOffset: { width: 0, height: rp(2) },
        shadowOpacity: 0.2,
        shadowRadius: rp(4),
        elevation: rp(4),
    },
};

// Create custom shadow
export const createShadow = (
    size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' = 'medium',
    color: string = '#000',
    opacity: number = 0.15,
    customOffset?: { width: number; height: number },
    customRadius?: number
): ShadowConfig => {
    const baseShadow = SHADOW_PRESETS[size];

    return {
        shadowColor: color,
        shadowOffset: customOffset || baseShadow.shadowOffset,
        shadowOpacity: opacity,
        shadowRadius: customRadius || baseShadow.shadowRadius,
        elevation: Platform.OS === 'android' ? baseShadow.elevation : undefined,
    };
};

// Create shadow with custom elevation
export const createElevationShadow = (
    elevation: number,
    color: string = '#000',
    opacity: number = 0.15
): ShadowConfig => {
    const shadowOffset = { width: 0, height: rp(elevation / 2) };
    const shadowRadius = rp(elevation);

    return {
        shadowColor: color,
        shadowOffset,
        shadowOpacity: opacity,
        shadowRadius,
        elevation: Platform.OS === 'android' ? elevation : undefined,
    };
};

// Create inset shadow (for pressed states)
export const createInsetShadow = (
    size: 'tiny' | 'small' | 'medium' | 'large' = 'small',
    color: string = '#000',
    opacity: number = 0.1
): ShadowConfig => {
    const baseShadow = SHADOW_PRESETS[size];

    return {
        shadowColor: color,
        shadowOffset: { width: 0, height: -baseShadow.shadowOffset.height },
        shadowOpacity: opacity,
        shadowRadius: baseShadow.shadowRadius,
        elevation: Platform.OS === 'android' ? -baseShadow.elevation! : undefined,
    };
};

// Create glow effect
export const createGlowShadow = (
    color: string,
    intensity: number = 0.3,
    radius: number = 10
): ShadowConfig => {
    return {
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: intensity,
        shadowRadius: rp(radius),
        elevation: Platform.OS === 'android' ? rp(radius / 2) : undefined,
    };
};

// Create multiple shadows (for complex effects)
export const createMultipleShadows = (
    shadows: Array<{
        color: string;
        offset: { width: number; height: number };
        opacity: number;
        radius: number;
        elevation?: number;
    }>
): ShadowConfig[] => {
    return shadows.map(shadow => ({
        shadowColor: shadow.color,
        shadowOffset: shadow.offset,
        shadowOpacity: shadow.opacity,
        shadowRadius: shadow.radius,
        elevation: Platform.OS === 'android' ? shadow.elevation : undefined,
    }));
};

// Get shadow for specific component state
export const getShadowForState = (
    component: keyof typeof COMPONENT_SHADOWS,
    state: 'default' | 'hover' | 'pressed' | 'focused' | 'disabled' = 'default'
): ShadowConfig => {
    switch (component) {
        case 'card':
            return state === 'hover' ? COMPONENT_SHADOWS.cardHover : COMPONENT_SHADOWS.card;
        case 'button':
            return state === 'pressed' ? COMPONENT_SHADOWS.buttonPressed : COMPONENT_SHADOWS.button;
        case 'input':
            return state === 'focused' ? COMPONENT_SHADOWS.inputFocused : COMPONENT_SHADOWS.input;
        default:
            return COMPONENT_SHADOWS[component];
    }
};

// Get shadow with theme color
export const getThemedShadow = (
    size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' = 'medium',
    themeColor: keyof typeof COLOR_SHADOWS = 'primary'
): ShadowConfig => {
    const baseShadow = SHADOW_PRESETS[size];
    const colorShadow = COLOR_SHADOWS[themeColor];

    return {
        ...baseShadow,
        shadowColor: colorShadow.shadowColor,
    };
};

// Responsive shadow that scales with screen size
export const getResponsiveShadow = (
    size: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge' = 'medium',
    scaleFactor: number = 1
): ShadowConfig => {
    const baseShadow = SHADOW_PRESETS[size];

    return {
        shadowColor: baseShadow.shadowColor,
        shadowOffset: {
            width: baseShadow.shadowOffset.width * scaleFactor,
            height: baseShadow.shadowOffset.height * scaleFactor,
        },
        shadowOpacity: baseShadow.shadowOpacity,
        shadowRadius: baseShadow.shadowRadius * scaleFactor,
        elevation: Platform.OS === 'android' ? baseShadow.elevation! * scaleFactor : undefined,
    };
};

// Shadow utilities for common UI patterns
export const SHADOW_UTILS = {
    // Card shadows
    card: () => COMPONENT_SHADOWS.card,
    cardHover: () => COMPONENT_SHADOWS.cardHover,

    // Button shadows
    button: () => COMPONENT_SHADOWS.button,
    buttonPressed: () => COMPONENT_SHADOWS.buttonPressed,

    // Input shadows
    input: () => COMPONENT_SHADOWS.input,
    inputFocused: () => COMPONENT_SHADOWS.inputFocused,

    // Modal shadows
    modal: () => COMPONENT_SHADOWS.modal,
    dropdown: () => COMPONENT_SHADOWS.dropdown,

    // Navigation shadows
    header: () => COMPONENT_SHADOWS.header,
    tabBar: () => COMPONENT_SHADOWS.tabBar,
    drawer: () => COMPONENT_SHADOWS.drawer,

    // Floating elements
    floatingButton: () => COMPONENT_SHADOWS.floatingButton,
    tooltip: () => COMPONENT_SHADOWS.tooltip,

    // Content shadows
    bottomSheet: () => COMPONENT_SHADOWS.bottomSheet,
    avatar: () => COMPONENT_SHADOWS.avatar,
    image: () => COMPONENT_SHADOWS.image,

    // Status shadows
    badge: () => COMPONENT_SHADOWS.badge,
    chip: () => COMPONENT_SHADOWS.chip,

    // No shadow
    none: () => SHADOW_PRESETS.none,
};

// Export all shadow utilities
export const shadowUtils = {
    // Presets
    SHADOW_PRESETS,
    COMPONENT_SHADOWS,
    COLOR_SHADOWS,

    // Creation functions
    createShadow,
    createElevationShadow,
    createInsetShadow,
    createGlowShadow,
    createMultipleShadows,

    // Helper functions
    getShadowForState,
    getThemedShadow,
    getResponsiveShadow,

    // Quick access utilities
    SHADOW_UTILS,
};

export default shadowUtils;

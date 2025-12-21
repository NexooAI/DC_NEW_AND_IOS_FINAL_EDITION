import { Animated, Easing, Dimensions } from 'react-native';
import { responsiveUtils } from './responsiveUtils';

const { screenWidth, screenHeight } = responsiveUtils;

// Animation configuration interface
interface AnimationConfig {
    duration: number;
    easing: (value: number) => number;
    useNativeDriver: boolean;
}

// Common animation presets
export const ANIMATION_PRESETS = {
    // Fade animations
    fadeIn: {
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    },
    fadeOut: {
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    },
    fadeInSlow: {
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    },
    fadeOutSlow: {
        duration: 400,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    },

    // Scale animations
    scaleIn: {
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
    },
    scaleOut: {
        duration: 200,
        easing: Easing.in(Easing.back(0.8)),
        useNativeDriver: true,
    },
    scaleInBounce: {
        duration: 400,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
    },
    scaleInElastic: {
        duration: 500,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
    },

    // Slide animations
    slideInFromRight: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    },
    slideInFromLeft: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    },
    slideInFromTop: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    },
    slideInFromBottom: {
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    },
    slideOutToRight: {
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    },
    slideOutToLeft: {
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    },
    slideOutToTop: {
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    },
    slideOutToBottom: {
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    },

    // Rotation animations
    rotateIn: {
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    },
    rotateOut: {
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    },
    spin: {
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
    },

    // Bounce animations
    bounceIn: {
        duration: 400,
        easing: Easing.out(Easing.bounce),
        useNativeDriver: true,
    },
    bounceOut: {
        duration: 300,
        easing: Easing.in(Easing.bounce),
        useNativeDriver: true,
    },

    // Elastic animations
    elasticIn: {
        duration: 500,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
    },
    elasticOut: {
        duration: 400,
        easing: Easing.in(Easing.elastic(0.8)),
        useNativeDriver: true,
    },

    // Spring animations
    springIn: {
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    },
    springOut: {
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    },

    // Quick animations
    quick: {
        duration: 150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    },
    instant: {
        duration: 0,
        easing: Easing.linear,
        useNativeDriver: true,
    },
};

// Create fade animation
export const createFadeAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.fadeIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create scale animation
export const createScaleAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.scaleIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create slide animation
export const createSlideAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    direction: 'horizontal' | 'vertical' = 'horizontal',
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.slideInFromRight, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create rotation animation
export const createRotationAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.rotateIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create bounce animation
export const createBounceAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.bounceIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create elastic animation
export const createElasticAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.elasticIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create spring animation
export const createSpringAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    config: Partial<AnimationConfig> = {}
): Animated.CompositeAnimation => {
    const animationConfig = { ...ANIMATION_PRESETS.springIn, ...config };

    return Animated.timing(animatedValue, {
        toValue,
        ...animationConfig,
    });
};

// Create parallel animations
export const createParallelAnimations = (
    animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
    return Animated.parallel(animations);
};

// Create sequence animations
export const createSequenceAnimations = (
    animations: Animated.CompositeAnimation[]
): Animated.CompositeAnimation => {
    return Animated.sequence(animations);
};

// Create stagger animations
export const createStaggerAnimations = (
    animations: Animated.CompositeAnimation[],
    staggerDelay: number = 100
): Animated.CompositeAnimation => {
    const staggeredAnimations = animations.map((animation, index) => {
        return Animated.sequence([
            Animated.delay(index * staggerDelay),
            animation
        ]);
    });

    return Animated.parallel(staggeredAnimations);
};

// Create loop animation
export const createLoopAnimation = (
    animation: Animated.CompositeAnimation,
    iterations: number = -1
): Animated.CompositeAnimation => {
    return Animated.loop(animation, { iterations });
};

// Create pulse animation
export const createPulseAnimation = (
    animatedValue: Animated.Value,
    minValue: number = 0.8,
    maxValue: number = 1.2,
    duration: number = 1000
): Animated.CompositeAnimation => {
    const pulseIn = Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    });

    const pulseOut = Animated.timing(animatedValue, {
        toValue: minValue,
        duration: duration / 2,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    });

    return Animated.loop(Animated.sequence([pulseIn, pulseOut]));
};

// Create shake animation
export const createShakeAnimation = (
    animatedValue: Animated.Value,
    intensity: number = 10,
    duration: number = 500
): Animated.CompositeAnimation => {
    const shake1 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake2 = Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake3 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake4 = Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake5 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake6 = Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake7 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const shake8 = Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration / 8,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    return Animated.sequence([
        shake1, shake2, shake3, shake4, shake5, shake6, shake7, shake8
    ]);
};

// Create wiggle animation
export const createWiggleAnimation = (
    animatedValue: Animated.Value,
    intensity: number = 5,
    duration: number = 200
): Animated.CompositeAnimation => {
    const wiggle1 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 4,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const wiggle2 = Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: duration / 4,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const wiggle3 = Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 4,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    const wiggle4 = Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration / 4,
        easing: Easing.linear,
        useNativeDriver: true,
    });

    return Animated.sequence([wiggle1, wiggle2, wiggle3, wiggle4]);
};

// Create typing animation
export const createTypingAnimation = (
    animatedValue: Animated.Value,
    duration: number = 1000
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: duration / 2,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.timing(animatedValue, {
                toValue: 0,
                duration: duration / 2,
                easing: Easing.in(Easing.quad),
                useNativeDriver: true,
            }),
        ])
    );
};

// Create progress animation
export const createProgressAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = 1000
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false, // Progress animations typically don't use native driver
    });
};

// Create morphing animation (for shape changes)
export const createMorphAnimation = (
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = 300
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // Morphing animations typically don't use native driver
    });
};

// Create loading spinner animation
export const createSpinnerAnimation = (
    animatedValue: Animated.Value,
    duration: number = 1000
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
};

// Create breathing animation (for attention-grabbing elements)
export const createBreathingAnimation = (
    animatedValue: Animated.Value,
    minValue: number = 0.95,
    maxValue: number = 1.05,
    duration: number = 2000
): Animated.CompositeAnimation => {
    const breatheIn = Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    });

    const breatheOut = Animated.timing(animatedValue, {
        toValue: minValue,
        duration: duration / 2,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
    });

    return Animated.loop(Animated.sequence([breatheIn, breatheOut]));
};

// Create slide in from screen edge
export const createSlideInFromEdge = (
    animatedValue: Animated.Value,
    direction: 'left' | 'right' | 'top' | 'bottom',
    distance: number = screenWidth
): Animated.CompositeAnimation => {
    const toValue = direction === 'left' || direction === 'right' ? 0 : 0;

    return Animated.timing(animatedValue, {
        toValue,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    });
};

// Create slide out to screen edge
export const createSlideOutToEdge = (
    animatedValue: Animated.Value,
    direction: 'left' | 'right' | 'top' | 'bottom',
    distance: number = screenWidth
): Animated.CompositeAnimation => {
    let toValue = 0;

    switch (direction) {
        case 'left':
            toValue = -distance;
            break;
        case 'right':
            toValue = distance;
            break;
        case 'top':
            toValue = -distance;
            break;
        case 'bottom':
            toValue = distance;
            break;
    }

    return Animated.timing(animatedValue, {
        toValue,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    });
};

// Create zoom in animation
export const createZoomInAnimation = (
    animatedValue: Animated.Value,
    fromScale: number = 0,
    toScale: number = 1,
    duration: number = 300
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue: toScale,
        duration,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
    });
};

// Create zoom out animation
export const createZoomOutAnimation = (
    animatedValue: Animated.Value,
    fromScale: number = 1,
    toScale: number = 0,
    duration: number = 200
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue: toScale,
        duration,
        easing: Easing.in(Easing.back(0.8)),
        useNativeDriver: true,
    });
};

// Create flip animation
export const createFlipAnimation = (
    animatedValue: Animated.Value,
    duration: number = 600
): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    });
};

// Create card flip animation
export const createCardFlipAnimation = (
    frontAnimatedValue: Animated.Value,
    backAnimatedValue: Animated.Value,
    duration: number = 600
): Animated.CompositeAnimation => {
    const flipToBack = Animated.timing(frontAnimatedValue, {
        toValue: 0,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    });

    const flipToFront = Animated.timing(backAnimatedValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
    });

    return Animated.sequence([flipToBack, flipToFront]);
};

// Animation utilities for common UI patterns
export const ANIMATION_UTILS = {
    // Fade animations
    fadeIn: (animatedValue: Animated.Value) =>
        createFadeAnimation(animatedValue, 1, ANIMATION_PRESETS.fadeIn),
    fadeOut: (animatedValue: Animated.Value) =>
        createFadeAnimation(animatedValue, 0, ANIMATION_PRESETS.fadeOut),

    // Scale animations
    scaleIn: (animatedValue: Animated.Value) =>
        createScaleAnimation(animatedValue, 1, ANIMATION_PRESETS.scaleIn),
    scaleOut: (animatedValue: Animated.Value) =>
        createScaleAnimation(animatedValue, 0, ANIMATION_PRESETS.scaleOut),

    // Slide animations
    slideInFromRight: (animatedValue: Animated.Value) =>
        createSlideAnimation(animatedValue, 0, 'horizontal', ANIMATION_PRESETS.slideInFromRight),
    slideInFromLeft: (animatedValue: Animated.Value) =>
        createSlideAnimation(animatedValue, 0, 'horizontal', ANIMATION_PRESETS.slideInFromLeft),
    slideInFromTop: (animatedValue: Animated.Value) =>
        createSlideAnimation(animatedValue, 0, 'vertical', ANIMATION_PRESETS.slideInFromTop),
    slideInFromBottom: (animatedValue: Animated.Value) =>
        createSlideAnimation(animatedValue, 0, 'vertical', ANIMATION_PRESETS.slideInFromBottom),

    // Special animations
    pulse: (animatedValue: Animated.Value) =>
        createPulseAnimation(animatedValue),
    shake: (animatedValue: Animated.Value) =>
        createShakeAnimation(animatedValue),
    wiggle: (animatedValue: Animated.Value) =>
        createWiggleAnimation(animatedValue),
    breathing: (animatedValue: Animated.Value) =>
        createBreathingAnimation(animatedValue),
    spinner: (animatedValue: Animated.Value) =>
        createSpinnerAnimation(animatedValue),
};

// Export all animation utilities
export const animationUtils = {
    // Presets
    ANIMATION_PRESETS,

    // Creation functions
    createFadeAnimation,
    createScaleAnimation,
    createSlideAnimation,
    createRotationAnimation,
    createBounceAnimation,
    createElasticAnimation,
    createSpringAnimation,
    createParallelAnimations,
    createSequenceAnimations,
    createStaggerAnimations,
    createLoopAnimation,
    createPulseAnimation,
    createShakeAnimation,
    createWiggleAnimation,
    createTypingAnimation,
    createProgressAnimation,
    createMorphAnimation,
    createSpinnerAnimation,
    createBreathingAnimation,
    createSlideInFromEdge,
    createSlideOutToEdge,
    createZoomInAnimation,
    createZoomOutAnimation,
    createFlipAnimation,
    createCardFlipAnimation,

    // Quick access utilities
    ANIMATION_UTILS,
};

export default animationUtils;

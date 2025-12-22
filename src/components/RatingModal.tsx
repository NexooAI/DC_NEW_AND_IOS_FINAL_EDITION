import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    Linking,
    TextInput,
    KeyboardAvoidingView,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';
import Constants from 'expo-constants';

// Safely import StoreReview
let StoreReview: any;
try {
    StoreReview = require('expo-store-review');
} catch (error) {
    logger.warn('expo-store-review module not found', error);
}

// Check if running in Expo Go (store review not supported)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

const { width } = Dimensions.get('window');

interface RatingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmitFeedback?: (rating: number, feedback: string) => void;
    appName?: string;
}

const RATING_STORAGE_KEY = 'app_rating_data';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.nexooai.dcjewellery&hl=en_IN';
const APP_STORE_URL = 'https://apps.apple.com/us/app/dc-jewellers-gold-diamonds/id6755081937'; // Replace with your App Store ID

export default function RatingModal({
    visible,
    onClose,
    onSubmitFeedback,
    appName = 'DC Jewellers',
}: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [step, setStep] = useState<'rating' | 'feedback' | 'thanks'>('rating');
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const starAnims = useRef([...Array(5)].map(() => new Animated.Value(0))).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Reset state
            setRating(0);
            setFeedback('');
            setStep('rating');
            setShowFeedbackInput(false);

            // Animate modal appearance
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 7,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Animate stars sequentially
            starAnims.forEach((anim, index) => {
                Animated.sequence([
                    Animated.delay(100 + index * 80),
                    Animated.spring(anim, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 100,
                        friction: 5,
                    }),
                ]).start();
            });
        } else {
            scaleAnim.setValue(0);
            fadeAnim.setValue(0);
            starAnims.forEach((anim) => anim.setValue(0));
        }
    }, [visible]);

    const handleStarPress = (selectedRating: number) => {
        setRating(selectedRating);

        // Animate the selected star
        Animated.sequence([
            Animated.timing(starAnims[selectedRating - 1], {
                toValue: 1.3,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.spring(starAnims[selectedRating - 1], {
                toValue: 1,
                useNativeDriver: true,
                tension: 100,
                friction: 5,
            }),
        ]).start();
    };

    const handleSubmitRating = async () => {
        if (rating === 0) return;

        // Store rating data
        const ratingData = {
            rating,
            timestamp: new Date().toISOString(),
            hasRated: true,
        };
        await AsyncStorage.setItem(RATING_STORAGE_KEY, JSON.stringify(ratingData));

        if (rating >= 4) {
            // Good rating - prompt for store review
            try {
                // Check if StoreReview is available (not in Expo Go)
                if (StoreReview && StoreReview.isAvailableAsync && !isExpoGo) {
                    const isAvailable = await StoreReview.isAvailableAsync();
                    if (isAvailable) {
                        await StoreReview.requestReview();
                        logger.log('✅ Store review requested');
                    } else {
                        // Fallback: Open store link
                        openStoreLink();
                    }
                } else {
                    // In Expo Go or StoreReview not available - open store link directly
                    logger.log('📱 Opening store link (StoreReview not available in Expo Go)');
                    openStoreLink();
                }
            } catch (error) {
                logger.error('Error requesting store review:', error);
                openStoreLink();
            }
            setStep('thanks');
        } else {
            // Low rating - ask for feedback
            setShowFeedbackInput(true);
            setStep('feedback');
        }
    };

    const openStoreLink = () => {
        const storeUrl = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
        Linking.openURL(storeUrl).catch((error) => {
            logger.error('Error opening store link:', error);
        });
    };

    const handleSubmitFeedback = () => {
        if (onSubmitFeedback) {
            onSubmitFeedback(rating, feedback);
        }
        logger.log('📝 Feedback submitted:', { rating, feedback });
        setStep('thanks');
    };

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(scaleAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onClose();
        });
    };

    const getRatingText = () => {
        switch (rating) {
            case 1:
                return 'We are sorry 😔';
            case 2:
                return 'We can do better 🤔';
            case 3:
                return 'Good, but can improve 👍';
            case 4:
                return 'Great experience! 😊';
            case 5:
                return 'Excellent! Thank you! 🌟';
            default:
                return 'Tap a star to rate';
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star, index) => (
                    <Animated.View
                        key={star}
                        style={[
                            styles.starWrapper,
                            {
                                transform: [{ scale: starAnims[index] }],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => handleStarPress(star)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={48}
                                color={star <= rating ? '#FFD700' : '#D1D5DB'}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </View>
        );
    };

    const renderRatingStep = () => (
        <>
            {/* Header Image/Icon */}
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary + 'CC']}
                    style={styles.iconGradient}
                >
                    <Ionicons name="heart" size={40} color="white" />
                </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>Enjoying {appName}?</Text>
            <Text style={styles.subtitle}>
                Your feedback helps us improve and serve you better!
            </Text>

            {/* Stars */}
            {renderStars()}

            {/* Rating Text */}
            <Text style={styles.ratingText}>{getRatingText()}</Text>

            {/* Submit Button */}
            <TouchableOpacity
                style={[
                    styles.submitButton,
                    rating === 0 && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={rating === 0}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={
                        rating === 0
                            ? ['#D1D5DB', '#9CA3AF']
                            : [theme.colors.primary, theme.colors.primary + 'DD']
                    }
                    style={styles.submitButtonGradient}
                >
                    <Text style={styles.submitButtonText}>Submit Rating</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Maybe Later */}
            <TouchableOpacity onPress={handleClose} style={styles.laterButton}>
                <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>
        </>
    );

    const renderFeedbackStep = () => (
        <>
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    style={styles.iconGradient}
                >
                    <Ionicons name="chatbubble-ellipses" size={40} color="white" />
                </LinearGradient>
            </View>

            <Text style={styles.title}>Help Us Improve</Text>
            <Text style={styles.subtitle}>
                We'd love to hear what we can do better. Your feedback is valuable to us.
            </Text>

            {/* Feedback Input */}
            <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us what we can improve..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
                textAlignVertical="top"
            />

            {/* Submit Feedback Button */}
            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmitFeedback}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                    style={styles.submitButtonGradient}
                >
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity onPress={handleClose} style={styles.laterButton}>
                <Text style={styles.laterButtonText}>Skip</Text>
            </TouchableOpacity>
        </>
    );

    const renderThanksStep = () => (
        <>
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.iconGradient}
                >
                    <Ionicons name="checkmark-circle" size={50} color="white" />
                </LinearGradient>
            </View>

            <Text style={styles.title}>Thank You! 🎉</Text>
            <Text style={styles.subtitle}>
                {rating >= 4
                    ? 'Your support means the world to us! Thank you for rating our app.'
                    : 'Thank you for your valuable feedback. We will work hard to improve!'}
            </Text>

            {/* Close Button */}
            <TouchableOpacity
                style={styles.submitButton}
                onPress={handleClose}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                    style={styles.submitButtonGradient}
                >
                    <Text style={styles.submitButtonText}>Done</Text>
                </LinearGradient>
            </TouchableOpacity>
        </>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [{ scale: scaleAnim }],
                            },
                        ]}
                    >
                        <ScrollView
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                        >
                            {/* Close Button */}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={handleClose}
                            >
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>

                            {step === 'rating' && renderRatingStep()}
                            {step === 'feedback' && renderFeedbackStep()}
                            {step === 'thanks' && renderThanksStep()}
                        </ScrollView>
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// Hook to manage when to show rating prompt
export const useRatingPrompt = () => {
    const [showRating, setShowRating] = useState(false);

    const checkAndShowRating = async () => {
        try {
            const data = await AsyncStorage.getItem(RATING_STORAGE_KEY);

            if (data) {
                const ratingData = JSON.parse(data);

                // Don't show if user has already rated
                if (ratingData.hasRated) {
                    // Show again after 30 days
                    const lastRated = new Date(ratingData.timestamp);
                    const daysSinceRated = Math.floor(
                        (Date.now() - lastRated.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    if (daysSinceRated < 30) {
                        return false;
                    }
                }
            }

            // Check app launch count
            const launchCount = await AsyncStorage.getItem('app_launch_count');
            const count = launchCount ? parseInt(launchCount, 10) : 0;

            // Show rating after 5 app launches
            if (count >= 5) {
                setShowRating(true);
                return true;
            }

            return false;
        } catch (error) {
            logger.error('Error checking rating prompt:', error);
            return false;
        }
    };

    const incrementLaunchCount = async () => {
        try {
            const launchCount = await AsyncStorage.getItem('app_launch_count');
            const count = launchCount ? parseInt(launchCount, 10) : 0;
            await AsyncStorage.setItem('app_launch_count', (count + 1).toString());
        } catch (error) {
            logger.error('Error incrementing launch count:', error);
        }
    };

    const hideRating = () => setShowRating(false);

    const forceShowRating = () => setShowRating(true);

    return {
        showRating,
        checkAndShowRating,
        incrementLaunchCount,
        hideRating,
        forceShowRating,
    };
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
        width: width * 0.88,
        maxWidth: 400,
        backgroundColor: 'white',
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalContent: {
        padding: 24,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        padding: 8,
        zIndex: 10,
    },
    iconContainer: {
        marginBottom: 20,
        marginTop: 16,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    starWrapper: {
        padding: 4,
    },
    ratingText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '500',
        marginBottom: 24,
        height: 24,
    },
    submitButton: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    laterButton: {
        paddingVertical: 8,
    },
    laterButtonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
    },
    feedbackInput: {
        width: '100%',
        minHeight: 100,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
});


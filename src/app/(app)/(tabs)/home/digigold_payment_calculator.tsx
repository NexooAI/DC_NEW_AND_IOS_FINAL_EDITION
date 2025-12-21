import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Platform,
    Animated,
    PanResponder,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import useGlobalStore from "@/store/global.store";
import { useTranslation } from "@/hooks/useTranslation";
import { theme } from "@/constants/theme";
import api from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logger } from "@/utils/logger";
import { formatGoldWeight } from "@/utils/imageUtils";

const { width } = Dimensions.get("window");

interface BenefitRange {
    min: number;
    max: number;
    percentage: number;
    color: string;
}

const BENEFIT_RANGES: BenefitRange[] = [
    { min: 1, max: 76, percentage: 5, color: "#4CAF50" },
    { min: 76, max: 151, percentage: 3.75, color: "#45a049" },
    { min: 151, max: 226, percentage: 2, color: "#66bb6a" },
    { min: 226, max: 301, percentage: 0.75, color: "#81c784" },
    { min: 301, max: 330, percentage: 0, color: "#a5d6a7" },
];

// Default amount limits (fallback values)
const DEFAULT_MIN_AMOUNT = 100;
const DEFAULT_MAX_AMOUNT = 100000;

export default function DigiGoldPaymentCalculator() {
    const { t } = useTranslation();
    const router = useRouter();
    const { schemeId } = useLocalSearchParams();
    const { language, user } = useGlobalStore();

    const [schemeData, setSchemeData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [goldRate, setGoldRate] = useState<number>(0);
    const [goldRateDate, setGoldRateDate] = useState<string>("");
    const [passbookNumber, setPassbookNumber] = useState<string>("");

    // Amount limits from AsyncStorage
    const [amountLimits, setAmountLimits] = useState<{
        min_amount: string;
        max_amount: string;
    } | null>(null);

    // Weight input state
    const [weightInput, setWeightInput] = useState<string>("");
    const [weight, setWeight] = useState<number>(0);

    // Amount input state
    const [amountInput, setAmountInput] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);

    // Track which field was last changed by user to prevent circular updates
    const lastChangedRef = useRef<"weight" | "amount" | null>(null);

    // Calculated values
    const [youGetWeight, setYouGetWeight] = useState<number>(0);
    const [youGetAmount, setYouGetAmount] = useState<number>(0);
    const [benefitWeight, setBenefitWeight] = useState<number>(0);
    const [benefitAmount, setBenefitAmount] = useState<number>(0);
    const [currentBenefitPercent, setCurrentBenefitPercent] = useState<number>(5); // Default 5%
    const [pointerPosition, setPointerPosition] = useState<number>(0);
    const [progressBarWidth, setProgressBarWidth] = useState<number>(width - 32); // Default to screen width minus padding
    const [calculationMode, setCalculationMode] = useState<"today" | "total">("today"); // Toggle between Today and Total
    const [isAtLimit, setIsAtLimit] = useState<"min" | "max" | null>(null); // Track if at min or max limit

    // Refs for TextInputs to handle keyboard scrolling
    const weightInputRef = useRef<TextInput>(null);
    const amountInputRef = useRef<TextInput>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const weightInputLayout = useRef({ y: 0 });
    const amountInputLayout = useRef({ y: 0 });

    // Animated value for pointer position (in pixels)
    const pointerAnim = useRef(new Animated.Value(0)).current;
    const sliderPosition = useRef(new Animated.Value(0)).current;
    const currentBasePosition = useRef(0); // Track current base position
    const initialSliderPosition = useRef(0); // Track initial position when drag starts
    const isManualClick = useRef(false); // Track if we're manually clicking a range
    const isManualDrag = useRef(false); // Track if slider is being manually dragged
    const isSliderManuallySet = useRef(false); // Track if slider was manually set by user
    const blinkAnim = useRef(new Animated.Value(1)).current; // For blinking animation
    const borderFlashAnim = useRef(new Animated.Value(0)).current; // For border flashing animation

    // Update current base position when pointerAnim changes
    useEffect(() => {
        const listenerId = pointerAnim.addListener(({ value }) => {
            currentBasePosition.current = value;
        });
        return () => {
            pointerAnim.removeListener(listenerId);
        };
    }, []);

    // Pan responder for dragging the slider
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Mark that user is manually dragging slider
                isManualDrag.current = true;
                isSliderManuallySet.current = true; // User is manually controlling slider
                // Store initial position when drag starts
                initialSliderPosition.current = currentBasePosition.current;
                sliderPosition.setValue(0);
            },
            onPanResponderMove: (evt, gestureState) => {
                // Calculate new position based on initial position + drag distance
                const pointerWidth = 40;
                const halfButtonWidth = pointerWidth / 2;

                // Get the center position of the button
                const initialCenter = initialSliderPosition.current + halfButtonWidth;
                const newCenter = initialCenter + gestureState.dx;

                // Clamp center position to keep button fully visible
                const clampedCenter = Math.max(
                    halfButtonWidth,
                    Math.min(progressBarWidth - halfButtonWidth, newCenter)
                );

                // Calculate left edge position
                const newLeftEdge = clampedCenter - halfButtonWidth;

                // Update slider position relative to initial
                sliderPosition.setValue(newLeftEdge - initialSliderPosition.current);

                // Calculate percentage based on center position
                const percent = clampedCenter / progressBarWidth;
                const clampedPercent = Math.max(0, Math.min(1, percent));

                // Map to days (1-330) to find benefit range
                const days = Math.round(1 + (clampedPercent * 329));
                const clampedDays = Math.max(1, Math.min(330, days));

                // Find the benefit range for these days
                const range = BENEFIT_RANGES.find(
                    (r) => clampedDays >= r.min && clampedDays < r.max
                ) || BENEFIT_RANGES[BENEFIT_RANGES.length - 1];

                // ONLY update benefit percentage - DO NOT change amount/weight
                setCurrentBenefitPercent(range.percentage);
            },
            onPanResponderRelease: () => {
                // Reset slider position to sync with pointerAnim
                sliderPosition.setValue(0);
                // Reset manual drag flag after a short delay to allow benefit calculation
                setTimeout(() => {
                    isManualDrag.current = false;
                }, 100);
            },
        })
    ).current;

    // Load amount limits from AsyncStorage
    useEffect(() => {
        const loadAmountLimits = async () => {
            try {
                const storedLimits = await AsyncStorage.getItem("amountLimits");
                if (storedLimits) {
                    const limits = JSON.parse(storedLimits);
                    setAmountLimits(limits);
                    logger.log("Amount limits loaded:", limits);
                }
            } catch (error) {
                logger.error("Error loading amount limits:", error);
            }
        };
        loadAmountLimits();
    }, []);

    // Get min and max amount values (use AsyncStorage values if available, otherwise fallback to defaults)
    const MIN_AMOUNT = amountLimits?.min_amount ? Number(amountLimits.min_amount) : DEFAULT_MIN_AMOUNT;
    const MAX_AMOUNT = amountLimits?.max_amount ? Number(amountLimits.max_amount) : DEFAULT_MAX_AMOUNT;

    // Load scheme data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const storedData = await AsyncStorage.getItem("@current_scheme_data");
                if (storedData) {
                    const parsed = JSON.parse(storedData);
                    setSchemeData(parsed);

                    // Generate or fetch passbook number (you may need to adjust this based on your API)
                    if (parsed.passbookNumber) {
                        setPassbookNumber(parsed.passbookNumber);
                    } else {
                        // Generate a temporary passbook number format
                        setPassbookNumber(`APP26DGP${Math.floor(Math.random() * 1000000)}`);
                    }
                }

                // Fetch gold rate with cache
                const { fetchGoldRatesWithCache } = await import("@/utils/apiCache");
                const rateData = await fetchGoldRatesWithCache();
                if (rateData?.gold_rate) {
                    const rate = parseFloat(rateData.gold_rate);
                    setGoldRate(rate);
                    setGoldRateDate(
                        rateData.updated_at || new Date().toLocaleDateString()
                    );

                    // No default weight - user will enter their own value
                }
            } catch (error) {
                logger.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [schemeId]);

    // Ensure amount is clamped to max on mount and when gold rate changes (but allow 0)
    useEffect(() => {
        if (amount > MAX_AMOUNT) {
            setAmount(MAX_AMOUNT);
            setAmountInput(MAX_AMOUNT.toString());
        }
        // Also clamp weight to maximum based on gold rate
        if (goldRate > 0 && weight > 0) {
            const maxWeight = MAX_AMOUNT / goldRate;
            if (weight > maxWeight) {
                const clampedWeight = maxWeight;
                setWeight(clampedWeight);
                setWeightInput(clampedWeight.toFixed(3));
            }
        }
    }, [goldRate, amountLimits, amount, weight]);

    // Check if amount/weight is at min or max limit and trigger blinking animation
    useEffect(() => {
        if (goldRate <= 0) {
            setIsAtLimit(null);
            return;
        }

        const maxWeight = MAX_AMOUNT / goldRate;

        // Check both amount and weight for limits
        const isAtMin = (amount <= 0 && weight <= 0) || amount === 0;
        const isAtMax = amount >= MAX_AMOUNT || (goldRate > 0 && weight >= maxWeight);

        if (isAtMin) {
            setIsAtLimit("min");
        } else if (isAtMax) {
            setIsAtLimit("max");
        } else {
            setIsAtLimit(null);
        }
    }, [amount, weight, goldRate, amountLimits]);

    // Blinking animation when at limit
    useEffect(() => {
        if (isAtLimit) {
            // Start blinking animation
            const blinkAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(blinkAnim, {
                        toValue: 0.3,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(blinkAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            blinkAnimation.start();
            return () => {
                blinkAnimation.stop();
                blinkAnim.setValue(1);
            };
        } else {
            // Stop blinking and reset opacity
            blinkAnim.setValue(1);
        }
    }, [isAtLimit]);

    // Flashing border animation - flashes periodically
    useEffect(() => {
        const flashAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(borderFlashAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: false, // Border color animation doesn't support native driver
                }),
                Animated.timing(borderFlashAnim, {
                    toValue: 0,
                    duration: 800,
                    useNativeDriver: false,
                }),
                Animated.delay(2000), // Pause for 2 seconds before next flash
            ])
        );
        flashAnimation.start();
        return () => {
            flashAnimation.stop();
            borderFlashAnim.setValue(0);
        };
    }, []);

    // Calculate pointer position and benefit percentage based on amount/weight
    // useEffect(() => {
    //     if (goldRate <= 0) return;

    //     // Don't calculate if progressBarWidth is not yet measured (must be > 0)
    //     if (progressBarWidth <= 0) return;

    //     // Skip animation if this is a manual click or manual drag (user is controlling slider)
    //     if (isManualClick.current) {
    //         isManualClick.current = false;
    //         return;
    //     }

    //     // Skip if user is manually dragging - only update benefit when they release
    //     if (isManualDrag.current) {
    //         return;
    //     }

    //     // Calculate days based on amount or weight
    //     // Formula: Map amount/weight to days (1-330 range)
    //     // You can adjust this formula based on your business logic
    //     const sourceAmount = lastChangedRef.current === "weight" && weight > 0
    //         ? weight * goldRate
    //         : amount;

    //     // If amount is at MAX_AMOUNT and slider was manually set, don't auto-move slider
    //     if (sourceAmount >= MAX_AMOUNT && isSliderManuallySet.current) {
    //         // Only update benefit percentage based on current slider position, don't move slider
    //         return;
    //     }

    //     // Map amount to days (1-330)
    //     // Using MIN_AMOUNT and MAX_AMOUNT constants
    //     // Allow 0 amount - it maps to 0 days
    //     const clampedAmount = Math.min(MAX_AMOUNT, Math.max(0, sourceAmount));
    //     const days = sourceAmount <= 0
    //         ? 0
    //         : Math.round(
    //             1 + ((clampedAmount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 329
    //         );

    //     // Clamp days to valid range
    //     const clampedDays = Math.max(0, Math.min(330, days));

    //     // Find the benefit range for these days
    //     const range = BENEFIT_RANGES.find(
    //         (r) => clampedDays >= r.min && clampedDays < r.max
    //     ) || BENEFIT_RANGES[BENEFIT_RANGES.length - 1];

    //     setCurrentBenefitPercent(range.percentage);

    //     // Calculate pointer position as percentage (0-100%)
    //     // If days is 0, position at start (0%)
    //     const positionPercent = clampedDays <= 0 ? 0 : ((clampedDays - 1) / 329) * 100;
    //     setPointerPosition(positionPercent);

    //     // Calculate pixel position (accounting for pointer width to center it)
    //     const pointerWidth = 40; // Increased pointer width for slider button
    //     const halfButtonWidth = pointerWidth / 2;
    //     // Calculate position - center the button on the progress bar position
    //     // Use the full progressBarWidth for calculation
    //     const pixelPosition = (positionPercent / 100) * progressBarWidth;
    //     // Clamp to ensure button center stays within track bounds
    //     // Left edge: halfButtonWidth (button center at left edge)
    //     // Right edge: progressBarWidth - halfButtonWidth (button center at right edge)
    //     const clampedPixelPosition = Math.max(
    //         halfButtonWidth,
    //         Math.min(progressBarWidth - halfButtonWidth, pixelPosition)
    //     ) - halfButtonWidth; // Subtract half width to position left edge

    //     // Animate pointer to new position
    //     Animated.spring(pointerAnim, {
    //         toValue: clampedPixelPosition,
    //         useNativeDriver: true,
    //         tension: 50,
    //         friction: 7,
    //     }).start();

    //     // Always reset slider position to 0 (it's relative to pointerAnim)
    //     sliderPosition.setValue(0);

    //     // Reset manual flag when amount changes (unless it's at max)
    //     if (sourceAmount < MAX_AMOUNT) {
    //         isSliderManuallySet.current = false;
    //     }
    // }, [amount, weight, goldRate, progressBarWidth]);

    // Calculate derived values using useMemo to prevent infinite loops
    // CALCULATION FORMULA:
    // TODAY MODE:
    // 1. User enters either Weight OR Amount - the other auto-adjusts
    // 2. Benefits Amount = (Entered Amount × Selected Benefit %) / 100
    // 3. Benefits Weight = (Entered Weight × Selected Benefit %) / 100
    // 4. You Get Amount = Entered Amount + Benefits Amount
    // 5. You Get Weight = Entered Weight + Benefits Weight
    //
    // TOTAL MODE:
    // 1. Amount is converted to days (1-330 range)
    // 2. Each day range has its own benefit %
    // 3. If amount spans multiple ranges, calculate benefits for each range separately
    // 4. Total Benefits = Sum of benefits from all day ranges
    const calculatedValues = useMemo(() => {
        if (goldRate <= 0) {
            return {
                youGetWeight: 0,
                youGetAmount: 0,
                benefitWeight: 0,
                benefitAmount: 0,
                calculatedWeight: 0,
                calculatedAmount: 0,
                enteredWeight: 0,
                enteredAmount: 0,
            };
        }

        // Determine which value was entered by user (source of truth)
        let enteredWeight = weight;
        let enteredAmount = amount;
        let calculatedWeight = weight;
        let calculatedAmount = amount;

        // Calculate maximum weight based on MAX_AMOUNT and gold rate
        const maxWeight = MAX_AMOUNT / goldRate;

        // Auto-adjust the other field based on which one was entered
        // IMPORTANT: Clamp values to max limit only (allow 0 and values below min)
        if (lastChangedRef.current === "weight" && weight > 0) {
            // User entered Weight - calculate Amount from Weight
            // Clamp weight to maximum first
            enteredWeight = Math.min(maxWeight, weight);
            calculatedAmount = enteredWeight * goldRate;
            // Clamp amount to max only
            calculatedAmount = Math.min(MAX_AMOUNT, calculatedAmount);
            enteredAmount = calculatedAmount;
        } else if (lastChangedRef.current === "amount" && amount > 0) {
            // User entered Amount - calculate Weight from Amount
            // Clamp amount to max only
            enteredAmount = Math.min(MAX_AMOUNT, amount);
            calculatedWeight = enteredAmount / goldRate;
            // Clamp weight to maximum
            calculatedWeight = Math.min(maxWeight, calculatedWeight);
            enteredWeight = calculatedWeight;
        } else if (weight > 0) {
            // Default: Weight was entered
            // Clamp weight to maximum first
            enteredWeight = Math.min(maxWeight, weight);
            calculatedAmount = enteredWeight * goldRate;
            // Clamp amount to max only
            calculatedAmount = Math.min(MAX_AMOUNT, calculatedAmount);
            enteredAmount = calculatedAmount;
        } else if (amount > 0) {
            // Default: Amount was entered
            // Clamp amount to max only
            enteredAmount = Math.min(MAX_AMOUNT, amount);
            calculatedWeight = enteredAmount / goldRate;
            // Clamp weight to maximum
            calculatedWeight = Math.min(maxWeight, calculatedWeight);
            enteredWeight = calculatedWeight;
        }

        let benefitAmount = 0;
        let benefitWeight = 0;

        if (calculationMode === "today") {
            // TODAY MODE: Simple calculation using selected benefit %
            // Benefits Amount = (Entered Amount × Selected Benefit %) / 100
            benefitAmount = (enteredAmount * currentBenefitPercent) / 100;
            // Benefits Weight = (Entered Weight × Selected Benefit %) / 100
            benefitWeight = (enteredWeight * currentBenefitPercent) / 100;
        } else {
            // TOTAL MODE: Cumulative calculation based on days
            // Convert amount to days (1-330)
            // Use MIN_AMOUNT as base for calculation, but allow enteredAmount to be below it
            const clampedAmount = Math.min(MAX_AMOUNT, Math.max(0, enteredAmount));
            // Map amount to days: 0 maps to 0 days, MIN_AMOUNT maps to 1 day, MAX_AMOUNT maps to 330 days
            const totalDays = enteredAmount <= 0
                ? 0
                : Math.round(
                    1 + ((clampedAmount - MIN_AMOUNT) / (MAX_AMOUNT - MIN_AMOUNT)) * 329
                );
            const clampedDays = Math.max(0, Math.min(330, totalDays));

            // Calculate amount per day (avoid division by zero)
            const amountPerDay = clampedDays > 0 ? clampedAmount / clampedDays : 0;

            // Find the slider position day (cutoff day)
            // Map currentBenefitPercent to find which range it belongs to
            const sliderRange = BENEFIT_RANGES.find(
                (r) => Math.abs(r.percentage - currentBenefitPercent) < 0.1
            ) || BENEFIT_RANGES[0]; // Default to first range (5%)

            // Calculate cutoff day (start of the slider's range)
            const cutoffDay = sliderRange.min;

            // Calculate benefits for each day range
            let totalBenefitAmount = 0;
            let totalBenefitWeight = 0;

            for (let day = 1; day <= clampedDays; day++) {
                let dayBenefitPercent = 0;

                if (day < cutoffDay) {
                    // Days before cutoff: Use default 5% (first range)
                    dayBenefitPercent = BENEFIT_RANGES[0].percentage; // 5%
                } else {
                    // Days from cutoff onwards: Use slider position %
                    dayBenefitPercent = currentBenefitPercent;
                }

                // Calculate benefit for this day
                const dayBenefitAmount = (amountPerDay * dayBenefitPercent) / 100;
                const dayBenefitWeight = ((amountPerDay / goldRate) * dayBenefitPercent) / 100;

                totalBenefitAmount += dayBenefitAmount;
                totalBenefitWeight += dayBenefitWeight;
            }

            benefitAmount = totalBenefitAmount;
            benefitWeight = totalBenefitWeight;
        }

        // Calculate final "You Get" values
        // You Get Amount = Entered Amount + Benefits Amount
        const youGetAmount = enteredAmount + benefitAmount;
        // You Get Weight = Entered Weight + Benefits Weight
        const youGetWeight = enteredWeight + benefitWeight;

        return {
            youGetWeight,
            youGetAmount,
            benefitWeight,
            benefitAmount,
            calculatedWeight,
            calculatedAmount,
            enteredWeight,
            enteredAmount,
        };
    }, [weight, amount, goldRate, currentBenefitPercent, calculationMode, amountLimits]);

    // Update calculated values when they change
    useEffect(() => {
        setYouGetWeight(calculatedValues.youGetWeight);
        setYouGetAmount(calculatedValues.youGetAmount);
        setBenefitWeight(calculatedValues.benefitWeight);
        setBenefitAmount(calculatedValues.benefitAmount);

        // Sync the other field only if it wasn't the last changed
        if (lastChangedRef.current === "weight" && calculatedValues.calculatedAmount > 0) {
            // Clamp amount to max only when syncing from weight
            const clampedAmount = Math.min(MAX_AMOUNT, calculatedValues.calculatedAmount);
            setAmount(clampedAmount);
            setAmountInput(clampedAmount.toFixed(0));
        } else if (lastChangedRef.current === "amount" && calculatedValues.calculatedWeight > 0) {
            setWeight(calculatedValues.calculatedWeight);
            setWeightInput(calculatedValues.calculatedWeight.toFixed(3)); // Changed to 3 decimal places
        }
    }, [calculatedValues]);

    const handleWeightIncrement = () => {
        if (goldRate <= 0) return;
        const current = parseFloat(weightInput) || 0;
        const maxWeight = MAX_AMOUNT / goldRate;
        const newWeight = Math.min(maxWeight, current + 0.001);
        lastChangedRef.current = "weight";
        setWeightInput(newWeight.toFixed(3)); // Changed to 3 decimal places
        setWeight(newWeight);
    };

    const handleWeightDecrement = () => {
        const current = parseFloat(weightInput);
        if (current > 0.001) {
            const newWeight = current - 0.001;
            lastChangedRef.current = "weight";
            setWeightInput(newWeight.toFixed(3)); // Changed to 3 decimal places
            setWeight(newWeight);
        }
    };

    const handleWeightInputChange = (text: string) => {
        // Allow only numbers and one decimal point
        let cleaned = text.replace(/[^0-9.]/g, "");

        // Prevent multiple decimal points
        const parts = cleaned.split(".");
        if (parts.length > 2) {
            cleaned = parts[0] + "." + parts.slice(1).join("");
        }

        // Limit to 3 decimal places
        if (parts.length === 2 && parts[1].length > 3) {
            cleaned = parts[0] + "." + parts[1].substring(0, 3);
        }

        if (cleaned === "" || cleaned === ".") {
            lastChangedRef.current = "weight";
            setWeightInput("");
            setWeight(0);
            return;
        }
        const numValue = parseFloat(cleaned);
        if (!isNaN(numValue) && numValue >= 0 && goldRate > 0) {
            // Calculate maximum weight based on MAX_AMOUNT and gold rate
            const maxWeight = MAX_AMOUNT / goldRate;
            // Clamp weight to maximum (allow 0 and values below min)
            const clampedWeight = Math.min(maxWeight, numValue);

            lastChangedRef.current = "weight";
            setWeightInput(clampedWeight.toFixed(3));
            setWeight(clampedWeight);
        } else if (!isNaN(numValue) && numValue >= 0) {
            // If gold rate not loaded yet, just set the weight (will be clamped when gold rate loads)
            lastChangedRef.current = "weight";
            setWeightInput(cleaned);
            setWeight(numValue);
        }
    };

    const handleAmountIncrement = () => {
        const current = parseFloat(amountInput) || 0;
        const newAmount = Math.min(MAX_AMOUNT, current + 100);
        lastChangedRef.current = "amount";
        setAmountInput(newAmount.toFixed(0));
        setAmount(newAmount);
    };

    const handleAmountDecrement = () => {
        const current = parseFloat(amountInput) || 0;
        if (current > 0) {
            const newAmount = Math.max(0, current - 100);
            lastChangedRef.current = "amount";
            setAmountInput(newAmount > 0 ? newAmount.toFixed(0) : "");
            setAmount(newAmount);
        }
    };

    const handleAmountInputChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, "");
        if (cleaned === "") {
            lastChangedRef.current = "amount";
            setAmountInput("");
            setAmount(0);
            return;
        }
        const numValue = parseFloat(cleaned);
        if (!isNaN(numValue) && numValue >= 0) {
            // Auto-clamp to max limit (allow 0 and values below min)
            const clampedValue = Math.min(MAX_AMOUNT, numValue);
            lastChangedRef.current = "amount";
            setAmountInput(clampedValue.toFixed(0));
            setAmount(clampedValue);
        }
    };

    // Handle clicking on a benefit range to move slider
    // IMPORTANT: This only changes the benefit percentage, NOT the entered amount/weight
    const handleRangeClick = (range: BenefitRange) => {
        if (progressBarWidth <= 0 || goldRate <= 0) return;

        // Stop any ongoing animations first
        pointerAnim.stopAnimation();
        sliderPosition.stopAnimation();

        // Mark that this is a manual click to prevent useEffect from interfering
        isManualClick.current = true;
        isSliderManuallySet.current = true; // User manually clicked a range

        // Only update the benefit percentage - DO NOT change amount/weight
        setCurrentBenefitPercent(range.percentage);

        // Calculate the center day of the range for slider position
        const centerDay = (range.min + range.max) / 2;
        const clampedDay = Math.max(1, Math.min(330, centerDay));

        // Calculate position percentage
        const positionPercent = ((clampedDay - 1) / 329) * 100;

        // Calculate pixel position with proper bounds
        const pointerWidth = 40;
        const halfButtonWidth = pointerWidth / 2;
        // Calculate center position of button
        const centerPosition = (positionPercent / 100) * progressBarWidth;
        // Clamp center position to keep button fully visible
        const clampedCenter = Math.max(
            halfButtonWidth,
            Math.min(progressBarWidth - halfButtonWidth, centerPosition)
        );
        // Position left edge of button
        const clampedPixelPosition = clampedCenter - halfButtonWidth;

        // Update the ref to track current position
        currentBasePosition.current = clampedPixelPosition;
        initialSliderPosition.current = clampedPixelPosition;

        // Animate slider to new position smoothly
        Animated.spring(pointerAnim, {
            toValue: clampedPixelPosition,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();

        Animated.spring(sliderPosition, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    };



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>{t("loading")}</Text>
            </View>
        );
    }

    const schemeName = schemeData?.name || t("digiGoldScheme");
    const userName = user?.name || t("user");

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "top"]}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="none"
                >
                    {/* Gold Rate Card - DYNAMIC: goldRate, goldRateDate */}
                    <LinearGradient
                        colors={["#1a2a39", "#2a3a49", "#1a2a39"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.goldRateCard}
                    >
                        <View style={styles.goldRateBar} />
                        <View style={styles.goldRateContent}>
                            <View style={styles.goldRateLeftSection}>
                                <LinearGradient
                                    colors={["#FFD700", "#FFA500", "#FFD700"]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.goldIconContainer}
                                >
                                    <Ionicons name="diamond" size={20} color="#1a2a39" />
                                </LinearGradient>
                                <View style={styles.goldRateTextContainer}>
                                    <Text style={styles.goldRateLabel}>
                                        {t("goldRate22KT")} • <Text style={styles.goldRateDate}>
                                            {goldRateDate
                                                ? new Date(goldRateDate).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })
                                                : new Date().toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.goldRateValueContainer}>
                                <Text style={styles.goldRateValue}>
                                    ₹ {goldRate.toLocaleString("en-IN")} <Text style={styles.goldRateUnit}>/grams</Text>
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Benefit Section - DYNAMIC: currentBenefitPercent (calculated from amount/weight) */}
                    <View style={styles.benefitContainer}>
                        <LinearGradient
                            colors={["#FFFFFF", "#F8F9FA", "#FFFFFF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.benefitGradientBackground}
                        />
                        <View style={styles.benefitHeader}>
                            <View style={styles.benefitTitleContainer}>
                                <Ionicons name="trophy" size={20} color={theme.colors.secondary} style={styles.benefitIcon} />
                                <Text style={styles.benefitTitle}>
                                    {t("benefitTitle")}
                                </Text>
                            </View>

                        </View>

                        {/* Benefit Range Slider */}
                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarLabelContainer}>
                                <Text style={styles.progressBarLabelTitle}>Days Range</Text>
                                <View style={styles.benefitPercentContainer}>
                                    <LinearGradient
                                        colors={[theme.colors.secondary, theme.colors.secondary, theme.colors.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.benefitPercentBadge}
                                    >
                                        <View style={styles.benefitPercentInner}>
                                            <Text style={styles.benefitPercent}>
                                                {currentBenefitPercent % 1 === 0
                                                    ? currentBenefitPercent.toFixed(0)
                                                    : currentBenefitPercent.toFixed(2)}%
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </View>
                            </View>

                            <View
                                style={styles.progressBarWrapper}
                                onLayout={(event) => {
                                    const { width } = event.nativeEvent.layout;
                                    if (width > 0) {
                                        setProgressBarWidth(width);
                                    }
                                }}
                            >
                                {/* Progress Bar Track with Border */}
                                <View style={styles.progressBarTrackContainer}>
                                    <View style={styles.progressBarTrack}>
                                        {BENEFIT_RANGES.map((range, index) => {
                                            const rangeWidth =
                                                ((range.max - range.min) / 330) * 100;
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    activeOpacity={0.7}
                                                    onPress={() => handleRangeClick(range)}
                                                    style={[
                                                        styles.progressBarSegment,
                                                        {
                                                            width: `${rangeWidth}%`,
                                                            backgroundColor: range.color,
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.progressBarSegmentOverlay} />
                                                    <Text style={styles.progressBarSegmentText}>
                                                        {range.percentage}%
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Draggable Slider Button */}
                                <Animated.View
                                    style={[
                                        styles.sliderButtonContainer,
                                        {
                                            transform: [
                                                {
                                                    translateX: Animated.add(
                                                        pointerAnim,
                                                        sliderPosition
                                                    ),
                                                },
                                            ],
                                        },
                                    ]}
                                    {...panResponder.panHandlers}
                                >
                                    <LinearGradient
                                        colors={[theme.colors.secondary, "#FFA500", theme.colors.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.sliderButton}
                                    >
                                        <View style={styles.sliderButtonInner} />
                                        <View style={styles.sliderButtonDot} />
                                    </LinearGradient>
                                    <View style={styles.sliderButtonTriangle} />
                                </Animated.View>
                            </View>
                            <View style={styles.progressBarLabels}>
                                {BENEFIT_RANGES.map((range, index) => (
                                    <View key={index} style={styles.progressBarLabelItem}>
                                        <View style={styles.progressBarLabelDot} />
                                        <Text style={styles.progressBarLabel}>
                                            {range.min === 1 ? range.min : range.min}
                                        </Text>
                                    </View>
                                ))}
                                <View style={styles.progressBarLabelItem}>
                                    <View style={styles.progressBarLabelDot} />
                                    <Text style={styles.progressBarLabel}>
                                        {BENEFIT_RANGES[BENEFIT_RANGES.length - 1].max}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Input Section Title - STATIC */}
                    <Text style={styles.inputSectionTitle}>
                        {t("enterWeightOrAmount")}
                    </Text>
                    <Animated.Text
                        style={[
                            styles.limitText,
                            isAtLimit && styles.limitTextError,
                            { opacity: blinkAnim },
                        ]}
                    >
                        {t("minMaxLimit")
                            .replace("{min}", MIN_AMOUNT.toLocaleString("en-IN"))
                            .replace("{max}", MAX_AMOUNT.toLocaleString("en-IN"))}
                        {goldRate > 0 && (
                            <> | {t("maxWeightLabel").replace("{weight}", formatGoldWeight(MAX_AMOUNT / goldRate))}</>
                        )}
                    </Animated.Text>

                    {/* Input/Output Container with Flashing Border */}
                    <View style={styles.inputOutputContainer}>
                        <LinearGradient
                            colors={["#FFFEF5", "#FFF8E1", "#FFFEF5"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.inputOutputGradient}
                        />
                        <Animated.View
                            style={[
                                styles.inputOutputBorder,
                                {
                                    opacity: borderFlashAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1], // Fade in and out
                                    }),
                                },
                            ]}
                        />
                        {/* Weight Input Section - DYNAMIC: weightInput, youGetWeight, benefitWeight */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>{t("weight")}</Text>
                                <View
                                    style={styles.inputField}
                                    onLayout={(event) => {
                                        const { y } = event.nativeEvent.layout;
                                        weightInputLayout.current.y = y;
                                    }}
                                >
                                    <LinearGradient
                                        colors={["#FFD700", "#FFA500"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.inputUnitBadge}
                                    >
                                        <Text style={styles.inputUnit}>g</Text>
                                    </LinearGradient>
                                    <TextInput
                                        ref={weightInputRef}
                                        style={styles.inputText}
                                        value={weightInput}
                                        onChangeText={handleWeightInputChange}
                                        keyboardType="decimal-pad"
                                        placeholder="0.000"
                                        placeholderTextColor="#B8860B"
                                        numberOfLines={1}
                                        onFocus={() => {
                                            // Scroll to input when focused but keep keyboard open
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollTo({
                                                    y: weightInputLayout.current.y - 100,
                                                    animated: true,
                                                });
                                            }, 100);
                                        }}
                                        blurOnSubmit={false}
                                    />
                                    <View style={styles.incrementButtons}>
                                        <TouchableOpacity
                                            style={[styles.incrementButton, styles.incrementButtonTop]}
                                            onPress={handleWeightIncrement}
                                        >
                                            <LinearGradient
                                                colors={["#1a2a39", "#2a3a49"]}
                                                style={styles.incrementButtonGradient}
                                            >
                                                <Ionicons name="add" size={14} color="#FFD700" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.incrementButton, styles.incrementButtonBottom]}
                                            onPress={handleWeightDecrement}
                                        >
                                            <View style={styles.incrementButtonGrey}>
                                                <Ionicons name="remove" size={14} color="#666" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.outputContainer}>
                                <Text style={styles.outputLabel}>{t("youGet")}</Text>
                                <View style={styles.outputFieldOuterBorder}>
                                    <LinearGradient
                                        colors={[theme.colors.secondary, theme.colors.secondary, theme.colors.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.outputField, styles.outputFieldBordered]}
                                    >
                                        <LinearGradient
                                            colors={["#1a2a39", "#2a3a49"]}
                                            style={styles.outputUnitBadge}
                                        >
                                            <Text style={styles.outputUnit}>g</Text>
                                        </LinearGradient>
                                        <Text
                                            style={styles.outputText}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit={true}
                                            minimumFontScale={0.7}
                                        >
                                            {formatGoldWeight(youGetWeight)}
                                        </Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.benefitDisplay}>
                                    <Ionicons name="gift" size={14} color="#4CAF50" />
                                    <Text style={styles.benefitLabel}>{t("benefit")}</Text>
                                    <Text style={styles.benefitValue}>
                                        +{formatGoldWeight(benefitWeight)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Arrow Separator */}
                        <View style={styles.arrowContainer}>
                            <LinearGradient
                                colors={[theme.colors.secondary, theme.colors.secondary, theme.colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.arrowCircle}
                            >
                                <Ionicons name="swap-vertical" size={20} color="#1a2a39" />
                            </LinearGradient>
                        </View>

                        {/* Amount Input Section - DYNAMIC: amountInput, youGetAmount, benefitAmount */}
                        <View style={styles.inputRow}>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>{t("amount")}</Text>
                                <View
                                    style={styles.inputField}
                                    onLayout={(event) => {
                                        const { y } = event.nativeEvent.layout;
                                        amountInputLayout.current.y = y;
                                    }}
                                >
                                    <LinearGradient
                                        colors={["#FFD700", "#FFA500"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.inputUnitBadge}
                                    >
                                        <Text style={styles.inputUnit}>₹</Text>
                                    </LinearGradient>
                                    <TextInput
                                        ref={amountInputRef}
                                        style={styles.inputText}
                                        value={amountInput}
                                        onChangeText={handleAmountInputChange}
                                        keyboardType="number-pad"
                                        placeholder="0"
                                        placeholderTextColor="#B8860B"
                                        numberOfLines={1}
                                        onFocus={() => {
                                            // Scroll to input when focused but keep keyboard open
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollTo({
                                                    y: amountInputLayout.current.y - 100,
                                                    animated: true,
                                                });
                                            }, 100);
                                        }}
                                        blurOnSubmit={false}
                                    />
                                    <View style={styles.incrementButtons}>
                                        <TouchableOpacity
                                            style={[styles.incrementButton, styles.incrementButtonTop]}
                                            onPress={handleAmountIncrement}
                                        >
                                            <LinearGradient
                                                colors={["#1a2a39", "#2a3a49"]}
                                                style={styles.incrementButtonGradient}
                                            >
                                                <Ionicons name="add" size={14} color="#FFD700" />
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.incrementButton, styles.incrementButtonBottom]}
                                            onPress={handleAmountDecrement}
                                        >
                                            <View style={styles.incrementButtonGrey}>
                                                <Ionicons name="remove" size={14} color="#666" />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.outputContainer}>
                                <Text style={styles.outputLabel}>{t("youGet")}</Text>
                                <View style={styles.outputFieldOuterBorder}>
                                    <LinearGradient
                                        colors={[theme.colors.secondary, theme.colors.secondary, theme.colors.secondary]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.outputField, styles.outputFieldBordered]}
                                    >
                                        <LinearGradient
                                            colors={["#1a2a39", "#2a3a49"]}
                                            style={styles.outputUnitBadge}
                                        >
                                            <Text style={styles.outputUnit}>₹</Text>
                                        </LinearGradient>
                                        <Text
                                            style={styles.outputText}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit={true}
                                            minimumFontScale={0.7}
                                        >
                                            {youGetAmount.toLocaleString("en-IN")}
                                        </Text>
                                    </LinearGradient>
                                </View>
                                <View style={styles.benefitDisplay}>
                                    <Ionicons name="gift" size={14} color="#4CAF50" />
                                    <Text style={styles.benefitLabel}>{t("benefit")}</Text>
                                    <Text style={styles.benefitValue}>+₹{benefitAmount.toFixed(0)}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Disclaimer */}
                    <Text style={styles.disclaimer}>
                        {t("benefitDisclaimer")}
                    </Text>

                    {/* Continue Button */}
                    <TouchableOpacity
                        style={styles.continueButton}
                        disabled={amount < MIN_AMOUNT}
                        onPress={() => {
                            // Validate minimum amount before proceeding
                            if (amount < MIN_AMOUNT) {
                                return;
                            }

                            // Ensure we have valid amount and weight values
                            const finalAmount = amount > 0 ? amount : (youGetAmount > 0 ? youGetAmount : 0);
                            const finalWeight = weight > 0 ? weight : (youGetWeight > 0 ? youGetWeight : 0);
                            // Navigate to join_savings - go directly to step 2 (Details step)
                            router.push({
                                pathname: "/(tabs)/home/join_savings",
                                params: {
                                    schemeId: schemeId?.toString(),
                                    step: "2", // Go directly to step 2 (Details)
                                    amount: finalAmount.toString(),
                                    weight: finalWeight.toString(),
                                    calculatedAmount: youGetAmount.toString(),
                                    calculatedWeight: youGetWeight.toString(),
                                },
                            });
                        }}
                    >
                        {amount >= MIN_AMOUNT ? (
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.secondary]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.continueButtonGradient}
                            >
                                <Text style={styles.continueButtonText}>{t("continue")}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        ) : (
                            <View style={styles.continueButtonDisabled}>
                                <Text style={styles.continueButtonTextDisabled}>{t("continue")}</Text>
                                <Ionicons name="arrow-forward" size={20} color="#999" />
                            </View>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingTop: 0,
        paddingBottom: 100,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: theme.colors.textSecondary,
    },
    schemeInfoContainer: {
        marginBottom: 12, // Reduced spacing
    },
    schemeInfoText: {
        fontSize: 16,
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    boldText: {
        fontWeight: "bold",
    },
    passbookText: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    passbookNumber: {
        fontWeight: "bold",
        color: theme.colors.primary,
    },
    goldRateCard: {
        borderRadius: 16,
        marginTop: 0,
        marginBottom: 16,
        overflow: "hidden",
        flexDirection: "row",
        flex: 0,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    goldRateBar: {
        width: 5,
        backgroundColor: "#FFD700",
    },
    goldRateContent: {
        flex: 1,
        padding: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    goldRateLeftSection: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    goldIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.5,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    goldRateTextContainer: {
        flex: 1,
    },
    goldRateLabel: {
        fontSize: 12,
        color: "#FFD700",
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    goldRateDate: {
        fontSize: 11,
        color: "#B0BEC5",
        fontWeight: "500",
    },
    goldRateValueContainer: {
        alignItems: "flex-end",
    },
    goldRateValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFD700",
        letterSpacing: 0.5,
    },
    goldRateUnit: {
        fontSize: 11,
        color: "#B0BEC5",
        fontWeight: "500",
    },
    toggleContainer: {
        marginBottom: 16,
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.textPrimary,
        marginBottom: 8,
    },
    toggleWrapper: {
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        padding: 4,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    toggleButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: theme.colors.textSecondary,
    },
    toggleButtonTextActive: {
        color: "#fff",
    },
    benefitContainer: {
        marginBottom: 16,
        borderRadius: 20,
        padding: 20,
        position: "relative",
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    benefitGradientBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    benefitHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
        zIndex: 1,
    },
    benefitTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    benefitIcon: {
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    benefitTitle: {
        fontSize: 12,
        color: theme.colors.primary,
        fontWeight: "600",
        letterSpacing: 0.5,
    },
    benefitPercentContainer: {
        marginBottom: 0,
    },
    benefitPercentBadge: {
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 25,
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    benefitPercentInner: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },
    benefitPercent: {
        fontSize: 14,
        fontWeight: "900",
        color: theme.colors.primary,
        letterSpacing: 1.5,
        textAlign: "center",
        lineHeight: 18,
    },
    benefitPercentAsterisk: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.primary,
        textAlign: "center",
        lineHeight: 14,
        marginTop: -2,
    },
    progressBarContainer: {
        marginTop: 1,
        zIndex: 1,
    },
    progressBarLabelContainer: {
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    progressBarLabelTitle: {
        fontSize: 12,
        color: "#666",
        fontWeight: "600",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    progressBarWrapper: {
        position: "relative",
        marginBottom: 12,
        overflow: "visible",
    },
    progressBarTrackContainer: {
        borderRadius: 16,
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    progressBarTrack: {
        flexDirection: "row",
        height: 32,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
        borderWidth: 2,
        borderColor: "#E0E0E0",
    },
    progressBarSegment: {
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        borderRightWidth: 1,
        borderRightColor: "rgba(255, 255, 255, 0.3)",
    },
    progressBarSegmentOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.05)",
    },
    progressBarSegmentText: {
        fontSize: 11,
        fontWeight: "900",
        color: "#fff",
        textShadowColor: "rgba(0, 0, 0, 0.6)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        letterSpacing: 0.8,
        zIndex: 1,
    },
    sliderButtonContainer: {
        position: "absolute",
        top: -26,
        width: 52,
        height: 52,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
    },
    sliderButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 5,
        borderColor: "#fff",
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.6,
                shadowRadius: 10,
            },
            android: {
                elevation: 12,
            },
        }),
    },
    sliderButtonInner: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#FFA500",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    sliderButtonDot: {
        position: "absolute",
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#fff",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    sliderButtonTriangle: {
        position: "absolute",
        top: 50,
        width: 0,
        height: 0,
        backgroundColor: "transparent",
        borderStyle: "solid",
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 14,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: theme.colors.secondary,
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    progressBarLabels: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingHorizontal: 2,
    },
    progressBarLabelItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    progressBarLabelDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: theme.colors.secondary,
    },
    progressBarLabel: {
        fontSize: 11,
        color: "#666",
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    progressBarPercentages: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    progressBarPercentage: {
        fontSize: 10,
        fontWeight: "600",
        color: theme.colors.textPrimary,
    },
    inputSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1a2a39",
        marginBottom: 10,
        letterSpacing: 0.5,
    },
    limitText: {
        fontSize: 12,
        color: "#666",
        marginBottom: 14,
        textAlign: "center",
        fontStyle: "italic",
        paddingHorizontal: 8,
        paddingVertical: 6,
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
    },
    limitTextError: {
        color: "#FF3B30",
        fontWeight: "700",
        backgroundColor: "#FFEBEE",
    },
    inputOutputContainer: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        ...Platform.select({
            ios: {
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    inputOutputGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    inputOutputBorder: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: "#FFD700",
        pointerEvents: "none",
    },
    inputRow: {
        flexDirection: "row",
        marginBottom: 8, // Reduced spacing since container has padding
        gap: 12,
        flex: 0, // Don't grow
    },
    inputContainer: {
        flex: 1,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a2a39",
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    inputField: {
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 14,
        minHeight: 100,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#FFD700",
        ...Platform.select({
            ios: {
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    inputUnitBadge: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 5,
        minWidth: 0,
    },
    inputUnit: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a2a39",
    },
    inputText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "700",
        color: "#1a2a39",
        letterSpacing: 0.3,
        minWidth: 0,
        paddingRight: 1,
    },
    incrementButtons: {
        flexDirection: "column",
        marginLeft: 6,
        gap: 5,
        flexShrink: 0,
    },
    incrementButton: {
        width: 40,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
    },
    incrementButtonTop: {
        marginBottom: 0,
    },
    incrementButtonBottom: {
        marginTop: 0,
    },
    incrementButtonGradient: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
    },
    incrementButtonGrey: {
        width: "100%",
        height: "100%",
        backgroundColor: "#E0E0E0",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 6,
    },
    outputContainer: {
        flex: 1,
    },
    outputLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a2a39",
        marginBottom: 10,
        letterSpacing: 0.3,
    },
    outputField: {
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 14,
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    outputFieldBordered: {
        borderWidth: 2.5,
        borderColor: "#1a2a39",
    },
    outputFieldOuterBorder: {
        borderRadius: 16,
        borderWidth: 3,
        borderColor: theme.colors.secondary,
        padding: 2,
        ...Platform.select({
            ios: {
                shadowColor: theme.colors.secondary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    outputUnitBadge: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 40,
    },
    outputUnit: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFD700",
    },
    outputText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "700",
        color: "#1a2a39",
        letterSpacing: 0.3,
        minWidth: 0,
        paddingRight: 4,
    },
    benefitDisplay: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#E8F5E9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    benefitLabel: {
        fontSize: 12,
        color: "#2E7D32",
        fontWeight: "600",
    },
    benefitValue: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2E7D32",
        letterSpacing: 0.3,
    },
    arrowContainer: {
        alignItems: "center",
        marginVertical: 8,
    },
    arrowCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#FFD700",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.4,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    disclaimer: {
        fontSize: 11,
        color: "#666",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 20,
        fontStyle: "italic",
        paddingHorizontal: 12,
        lineHeight: 16,
    },
    continueButton: {
        borderRadius: 16,
        overflow: "hidden",
        marginTop: 8,
        flex: 0,
        ...Platform.select({
            ios: {
                shadowColor: "#1a2a39",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    continueButtonGradient: {
        padding: 18,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    continueButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 1,
    },
    continueButtonDisabled: {
        padding: 18,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        backgroundColor: "#E0E0E0",
    },
    continueButtonTextDisabled: {
        color: "#999",
        fontSize: 18,
        fontWeight: "700",
        letterSpacing: 1,
    },
});




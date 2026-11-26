import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, Text, TextStyle, View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

interface RollingAmountTextProps {
  amount: number;
  prefix?: string;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

function RollingDigit({
  targetDigit,
  delay,
  duration,
  style,
}: {
  targetDigit: number;
  delay: number;
  duration: number;
  style?: StyleProp<TextStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const flatStyle = (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style) || {};
  const fontSize = Number(flatStyle.fontSize) || 18;
  const lineHeight = Math.round(fontSize * 1.25);

  useEffect(() => {
    anim.setValue(0);
    // Spin through one full 0-9 cycle + targetDigit so it visibly rolls from 0
    const targetSteps = 10 + targetDigit;
    Animated.timing(anim, {
      toValue: targetSteps,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [targetDigit, delay, duration]);

  // Build 20-item strip (0..9 twice) so rolling 0 -> 10 + targetDigit is seamless
  const strip = [...DIGITS, ...DIGITS];
  const translateY = anim.interpolate({
    inputRange: [0, 19],
    outputRange: [0, -19 * lineHeight],
  });

  return (
    <View style={{ height: lineHeight, overflow: "hidden", justifyContent: "flex-start" }}>
      <Animated.View style={{ transform: [{ translateY }] }}>
        {strip.map((d, idx) => (
          <Text
            key={idx}
            style={[
              style,
              {
                height: lineHeight,
                lineHeight,
                includeFontPadding: false,
              },
            ]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * Digital odometer-style rolling amount display that rolls each digit from 0
 * and settles on the formatted rupee value.
 */
export function RollingAmountText({
  amount,
  prefix = "₹",
  style,
  duration = 950,
}: RollingAmountTextProps) {
  const formatted = Math.max(0, Math.round(Number(amount) || 0)).toLocaleString("en-IN");
  const chars = formatted.split("");

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {prefix ? <Text style={style}>{prefix}</Text> : null}
      {chars.map((ch, idx) => {
        const num = Number(ch);
        if (!Number.isNaN(num) && ch >= "0" && ch <= "9") {
          return (
            <RollingDigit
              key={`${idx}-${chars.length}`}
              targetDigit={num}
              delay={idx * 45}
              duration={duration}
              style={style}
            />
          );
        }
        return (
          <Text key={`sep-${idx}`} style={style}>
            {ch}
          </Text>
        );
      })}
    </View>
  );
}

interface CoinDropPotIconProps {
  metal: "gold" | "silver";
  size?: number;
}

/**
 * Animated coin-drop-into-jar icon for Gold and Silver savings totals.
 */
export function CoinDropPotIcon({ metal, size = 34 }: CoinDropPotIconProps) {
  const coin1Y = useRef(new Animated.Value(0)).current;
  const coin1Opacity = useRef(new Animated.Value(0)).current;
  const coin2Y = useRef(new Animated.Value(0)).current;
  const coin2Opacity = useRef(new Animated.Value(0)).current;
  const potBounce = useRef(new Animated.Value(1)).current;

  const coinFill = metal === "gold" ? "#FFD700" : "#E2E8F0";
  const coinStroke = metal === "gold" ? "#B45309" : "#64748B";
  const potFill = metal === "gold" ? "#F59E0B" : "#CBD5E1";
  const potDark = metal === "gold" ? "#92400E" : "#475569";

  useEffect(() => {
    const dropCoin = (yVal: Animated.Value, opVal: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(yVal, {
            toValue: 1,
            duration: 650,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opVal, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.delay(350),
            Animated.timing(opVal, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.timing(potBounce, { toValue: 1.12, duration: 90, useNativeDriver: true }),
          Animated.spring(potBounce, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.timing(yVal, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]);

    const loopAnim = Animated.loop(
      Animated.sequence([
        dropCoin(coin1Y, coin1Opacity, 150),
        dropCoin(coin2Y, coin2Opacity, 120),
        Animated.delay(900),
      ])
    );

    loopAnim.start();
    return () => loopAnim.stop();
  }, []);

  const coin1Translate = coin1Y.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 8],
  });

  const coin2Translate = coin2Y.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 8],
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "flex-end" }}>
      {/* Dropping Coin 1 */}
      <Animated.View
        style={{
          position: "absolute",
          top: 2,
          opacity: coin1Opacity,
          transform: [{ translateY: coin1Translate }],
          zIndex: 2,
        }}
      >
        <Svg width={11} height={11} viewBox="0 0 12 12">
          <Circle cx={6} cy={6} r={5} fill={coinFill} stroke={coinStroke} strokeWidth={1.2} />
        </Svg>
      </Animated.View>

      {/* Dropping Coin 2 */}
      <Animated.View
        style={{
          position: "absolute",
          top: 2,
          opacity: coin2Opacity,
          transform: [{ translateY: coin2Translate }],
          zIndex: 2,
        }}
      >
        <Svg width={10} height={10} viewBox="0 0 12 12">
          <Circle cx={6} cy={6} r={5} fill={coinFill} stroke={coinStroke} strokeWidth={1.2} />
        </Svg>
      </Animated.View>

      {/* Savings Jar / Pot */}
      <Animated.View style={{ transform: [{ scale: potBounce }] }}>
        <Svg width={size * 0.72} height={size * 0.65} viewBox="0 0 28 24">
          {/* Rim / Slot */}
          <Rect x={7} y={2} width={14} height={3.5} rx={1.7} fill={coinFill} stroke={potDark} strokeWidth={1} />
          {/* Body */}
          <Path
            d="M8 6 H20 C23.5 8.5 25 13 23.5 18.5 C22.5 21 20 22 14 22 C8 22 5.5 21 4.5 18.5 C3 13 4.5 8.5 8 6 Z"
            fill={potFill}
            stroke={potDark}
            strokeWidth={1.2}
          />
          {/* Subtle shine */}
          <Path d="M8.5 10 C7.5 12.5 7.5 15.5 8.5 17.5" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" opacity={0.65} fill="none" />
        </Svg>
      </Animated.View>
    </View>
  );
}

interface AnimatedWeightTextProps {
  weight: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

/**
 * Smoothly counts up accumulated metal weight (e.g. 0.000 g -> 1.250 g).
 */
export function AnimatedWeightText({ weight, style, duration = 900 }: AnimatedWeightTextProps) {
  const [displayWeight, setDisplayWeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = Math.max(0, Number(weight) || 0);
    anim.setValue(0);
    const id = anim.addListener(({ value }) => {
      setDisplayWeight(value);
    });
    Animated.timing(anim, {
      toValue: target,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setDisplayWeight(target);
    });
    return () => {
      anim.removeListener(id);
    };
  }, [weight, duration]);

  return <Text style={style}>{displayWeight.toFixed(3)} g</Text>;
}

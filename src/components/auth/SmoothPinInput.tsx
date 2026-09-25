import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface SmoothPinInputProps {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  secure?: boolean;
  allowToggleSecure?: boolean;
  eyeIconColor?: string;
  cursorColor?: string;
  autoFocus?: boolean;
  editable?: boolean;
  onComplete?: (code: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  boxStyle?: StyleProp<ViewStyle>;
  boxFocusedStyle?: StyleProp<ViewStyle>;
  boxFilledStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export const SmoothPinInput: React.FC<SmoothPinInputProps> = ({
  value = "",
  onChangeText,
  length = 4,
  secure = false,
  allowToggleSecure = false,
  eyeIconColor,
  cursorColor,
  autoFocus = true,
  editable = true,
  onComplete,
  containerStyle,
  boxStyle,
  boxFocusedStyle,
  boxFilledStyle,
  textStyle,
  testID,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isSecureVisible, setIsSecureVisible] = useState<boolean>(false);

  // When allowToggleSecure is true, toggle determines whether we mask with bullets
  const effectiveSecure = secure && !isSecureVisible;

  const handleChange = (text: string) => {
    // Only accept numeric digits, up to maximum length
    const clean = text.replace(/[^0-9]/g, "").slice(0, length);
    onChangeText(clean);

    if (clean.length === length && onComplete) {
      onComplete(clean);
    }
  };

  const handlePress = () => {
    if (editable) {
      inputRef.current?.focus();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.wrapper, containerStyle]}
      accessibilityRole="none"
      testID={testID || "smooth-pin-input-container"}
    >
      {/* 
        Single transparent input overlay that captures ALL keystrokes natively.
        Prevents iOS/Android keyboard connection resets and dropped 4th digits.
      */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={editable}
        textContentType={effectiveSecure ? "password" : "oneTimeCode"}
        autoComplete={effectiveSecure ? "off" : "sms-otp"}
        importantForAutofill={effectiveSecure ? "no" : "yes"}
        caretHidden={true}
        style={styles.hiddenInput}
        testID={testID ? `${testID}-hidden-input` : "smooth-pin-hidden-input"}
      />

      {/* Visual Boxes Row with Optional Eye Toggle */}
      <View style={styles.centerContainer}>
        <View style={styles.boxesRow} pointerEvents="none">
          {Array.from({ length }).map((_, index) => {
            const char = value[index] || "";
            const isFocused = editable && value.length === index;
            const isFilled = char.length > 0;

            return (
              <View
                key={index}
                style={[
                  styles.defaultBox,
                  boxStyle,
                  isFocused && [styles.defaultFocusedBox, boxFocusedStyle],
                  isFilled && [styles.defaultFilledBox, boxFilledStyle],
                ]}
                testID={`pin-box-${index}`}
              >
                {isFilled ? (
                  <Text
                    style={[
                      styles.defaultText,
                      textStyle,
                      effectiveSecure && styles.secureBullet,
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                  >
                    {effectiveSecure ? "●" : char}
                  </Text>
                ) : isFocused ? (
                  <View
                    style={[
                      styles.cursorIndicator,
                      { backgroundColor: cursorColor || "#d4af37" },
                    ]}
                  />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Eye Icon Button for show/hide PIN toggle */}
        {allowToggleSecure && secure && (
          <TouchableOpacity
            style={styles.eyeToggleBtn}
            onPress={() => setIsSecureVisible((prev) => !prev)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            testID={testID ? `${testID}-eye-toggle` : "smooth-pin-eye-toggle"}
          >
            <Ionicons
              name={isSecureVisible ? "eye-outline" : "eye-off-outline"}
              size={21}
              color={eyeIconColor || "#94a3b8"}
            />
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01, // Keep slightly > 0 so older Androids don't detach keyboard
    color: "transparent",
    zIndex: 2,
    fontSize: 1, // Minimize cursor footprint
  },
  centerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    width: "100%",
  },
  boxesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 1,
  },
  eyeToggleBtn: {
    position: "absolute",
    right: 0,
    padding: 6,
    zIndex: 3,
  },
  defaultBox: {
    width: 54,
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  defaultFocusedBox: {
    borderColor: "#d4af37",
    borderWidth: 2,
    backgroundColor: "#ffffff",
    ...Platform.select({
      ios: {
        shadowColor: "#d4af37",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  defaultFilledBox: {
    borderColor: "#d4af37",
    backgroundColor: "#fffdf5",
  },
  defaultText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0e1e38",
    textAlign: "center",
  },
  secureBullet: {
    fontSize: 18,
    lineHeight: 24,
  },
  cursorIndicator: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
});

export default SmoothPinInput;

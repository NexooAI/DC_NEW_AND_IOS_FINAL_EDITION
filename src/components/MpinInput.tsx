import React, { useState, useRef, useEffect } from "react";
import { View, TextInput, StyleSheet, NativeSyntheticEvent, TextInputKeyPressEventData } from "react-native";

interface MpinInputProps {
  length?: number;
  onComplete: (value: string) => void;
  secureTextEntry?: boolean; // Add this prop
  inputStyle?: any;
  containerStyle?: any;
}

const MpinInput: React.FC<MpinInputProps> = ({
  length = 4,
  onComplete,
  secureTextEntry = true, // Default to hiding text
  inputStyle = {},
  containerStyle = {},
}) => {
  const [pins, setPins] = useState(Array(length).fill(""));
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handlePinChange = (text: string, index: number) => {
    // Only allow numeric input and limit to 1 character
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 1);
    
    const newPins = [...pins];
    newPins[index] = numericText;
    setPins(newPins);

    // Auto focus the next input if available
    if (numericText.length === 1 && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Move focus backward when deleting
    if (numericText.length === 0 && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Always call onComplete with current value (not just when all are filled)
    const completeValue = newPins.join("");
    onComplete(completeValue);
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    // Handle backspace on empty field - move to previous field and clear it
    if (e.nativeEvent.key === "Backspace" && !pins[index] && index > 0) {
      const newPins = [...pins];
      newPins[index - 1] = "";
      setPins(newPins);
      inputRefs.current[index - 1]?.focus();
      const completeValue = newPins.join("");
      onComplete(completeValue);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {pins.map((pin, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            if (el) inputRefs.current[index] = el;
          }}
          style={[styles.input, inputStyle]}
          keyboardType="numeric"
          maxLength={1}
          secureTextEntry={secureTextEntry}
          value={pin}
          onChangeText={(text) => handlePinChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          textAlign="center"
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  input: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ffffff",
    borderRadius: 8,
    fontSize: 24,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
});

export default MpinInput;

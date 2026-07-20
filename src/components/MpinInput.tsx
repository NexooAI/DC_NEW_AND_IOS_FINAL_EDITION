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
          style={[
            styles.input,
            pin ? styles.inputFilled : styles.inputEmpty,
            inputStyle,
          ]}
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
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
  },
  input: {
    width: 58,
    height: 58,
    borderWidth: 2,
    borderRadius: 15,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    textAlign: "center",
    marginHorizontal: 4,
    // Soft shadow
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputEmpty: {
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  inputFilled: {
    borderColor: "#D4AF37", // Gold
    backgroundColor: "#ffffff",
    shadowColor: "#D4AF37", // Gold shadow
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default MpinInput;

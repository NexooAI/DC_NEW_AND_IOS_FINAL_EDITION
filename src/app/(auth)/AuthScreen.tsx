import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { COLORS } from "src/constants/colors";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

// Key for storing MPIN
const MPIN_KEY = "user_mpin";

export default function AuthScreen({ navigation }: { navigation: any }) {
  const [isMpinSet, setIsMpinSet] = useState(false);
  const [mpin, setMpin] = useState(""); // For setting a new MPIN
  const [enteredMpin, setEnteredMpin] = useState(""); // For verifying MPIN
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    checkMpin();
  }, []);

  // Check whether the device supports biometrics and if a biometric is enrolled.
  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    setBiometricSupported(compatible);

    if (compatible) {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricEnabled(enrolled);
    }
  };

  // Check if an MPIN has already been set.
  const checkMpin = async () => {
    const storedMpin = await SecureStore.getItemAsync(MPIN_KEY);
    if (storedMpin) {
      setIsMpinSet(true);
    }
  };

  // Set a new MPIN
  const handleSetMpin = async () => {
    if (mpin.length < 4) {
      Alert.alert("Error", "MPIN must be at least 4 digits");
      return;
    }
    try {
      await SecureStore.setItemAsync(MPIN_KEY, mpin);
      Alert.alert("Success", "MPIN set successfully!");
      setIsMpinSet(true);
    } catch (error) {
      Alert.alert("Error", "Failed to set MPIN");
    }
  };

  // Verify the MPIN entered by the user
  const handleVerifyMpin = async () => {
    const storedMpin = await SecureStore.getItemAsync(MPIN_KEY);
    if (enteredMpin === storedMpin) {
      // Alert.alert("Success", "MPIN verified!");
      navigation.navigate("Home"); // Replace "Home" with your main screen's route
    } else {
      Alert.alert("Error", "Incorrect MPIN");
    }
  };

  // Handle biometric authentication (fingerprint or face)
  const handleBiometricAuth = async () => {
    if (!biometricSupported) {
      Alert.alert(
        "Biometrics not supported",
        "Your device does not support biometric authentication."
      );
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate with Biometrics",
      fallbackLabel: "Enter MPIN", // Fallback to MPIN if needed
    });
    if (result.success) {
      Alert.alert("Success", "Biometric authentication successful!");
      navigation.navigate("Home"); // Replace "Home" with your main screen's route
    } else {
      Alert.alert("Authentication failed", "Please try again or use MPIN.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {/* If device supports and has biometrics enrolled, show biometric button */}
      {biometricSupported && biometricEnabled && (
        <TouchableOpacity style={styles.button} onPress={handleBiometricAuth}>
          <Text style={styles.buttonText}>Login with Biometrics</Text>
        </TouchableOpacity>
      )}

      {/* MPIN setup/verification flow */}
      {!isMpinSet ? (
        <>
          <Text style={styles.subtitle}>Set Your MPIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter MPIN"
            secureTextEntry
            keyboardType="numeric"
            value={mpin}
            onChangeText={setMpin}
          />
          <TouchableOpacity style={styles.button} onPress={handleSetMpin}>
            <Text style={styles.buttonText}>Set MPIN</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter Your MPIN</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter MPIN"
            secureTextEntry
            keyboardType="numeric"
            value={enteredMpin}
            onChangeText={setEnteredMpin}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyMpin}>
            <Text style={styles.buttonText}>Verify MPIN</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.backgroundSecondary,
  },
  title: {
    fontSize: 26,
    marginBottom: 20,
    color: COLORS.textDarkGrey,
  },
  subtitle: {
    fontSize: 20,
    marginVertical: 10,
    color: COLORS.textDarkGrey,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border.primary,
    borderRadius: 5,
    width: "80%",
    padding: 10,
    marginVertical: 10,
    textAlign: "center",
    fontSize: 18,
  },
  button: {
    backgroundColor: COLORS.info,
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
});

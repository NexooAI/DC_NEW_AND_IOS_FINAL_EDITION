import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function SchemeTestButton() {
  const router = useRouter();

  const testNavigation = () => {
    // Test with both parameters
    router.push("/home/schemes?schemeId=1&schemeType=Monthly");
  };

  const testSchemeTypeOnly = () => {
    // Test with only schemeType
    router.push("/home/schemes?schemeType=Daily");
  };

  const testSchemeIdOnly = () => {
    // Test with only schemeId
    router.push("/home/schemes?schemeId=2");
  };

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={testNavigation}>
        <Text style={styles.buttonText}>Test: Both Params</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testSchemeTypeOnly}>
        <Text style={styles.buttonText}>Test: SchemeType Only</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testSchemeIdOnly}>
        <Text style={styles.buttonText}>Test: SchemeId Only</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});

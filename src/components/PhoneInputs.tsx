import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  Alert,
  StyleSheet,
  Keyboard,
} from "react-native";
import { useTranslation } from "@/hooks/useTranslation";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  loading: boolean;
  onFocus?: () => void;
  disableBlurAlert?: boolean;
  label?: string;
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  loading,
  onFocus,
  disableBlurAlert = false,
  label,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState("");

  const validateMobile = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, "").slice(0, 10);
    onChangeText(numericText);

    if (numericText.length > 0) {
      setError("");
    }
    if (numericText.length === 10) {
      Keyboard.dismiss();
    }
  };

  const handleBlur = () => {
    // Skip alert if disableBlurAlert is true
    if (disableBlurAlert) {
      return;
    }

    if (!value) {
      setError(t("pleaseEnterMobile"));
      Alert.alert(t("error"), t("pleaseEnterMobile"));
      return;
    }

    if (value.length !== 10) {
      setError(t("validMobileNumber"));
      Alert.alert(t("error"), t("validMobileNumber"));
      return;
    }

    setError("");
  };

  const displayLabel = label || t("mobileNumber");

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{displayLabel}:</Text>

      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          placeholder={t("enterMobileNumber")}
          placeholderTextColor="rgba(0, 0, 0, 0.5)"
          value={value}
          onChangeText={validateMobile}
          onBlur={handleBlur}
          onFocus={onFocus}
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!loading}
          maxLength={10}
          style={[styles.input, error && styles.inputError]}
          scrollEnabled={false}
          multiline={false}
          numberOfLines={1}
          textContentType="telephoneNumber"
          autoComplete="tel"
          returnKeyType="done"
        />
      </View>

      {/* Count */}
      <Text style={styles.counterText}>{value.length}/10</Text>

      {/* Error message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    height: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: "#ffffff",
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  countryCodeBox: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 0,
    borderRightWidth: 1,
    borderRightColor: "rgba(0, 0, 0, 0.1)",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  countryCodeText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 0,
    fontSize: 16,
    height: 50,
    backgroundColor: "#ffffff",
    color: "#000000",
    fontWeight: "500",
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  inputError: {
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  counterText: {
    textAlign: "right",
    paddingRight: 4,
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  errorText: {
    color: "#ff4444",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    fontWeight: "500",
  },
});

export default PhoneInput;

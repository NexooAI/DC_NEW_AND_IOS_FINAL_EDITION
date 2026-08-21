import { useAppTheme } from "@/store/global.store";
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
  variant?: "default" | "line";
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChangeText,
  loading,
  onFocus,
  disableBlurAlert = false,
  label,
  variant = "default",
}) => {
  const theme = useAppTheme();
  styles = getStyles(theme, variant);
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
      <Text style={styles.label}>{displayLabel}</Text>

      <View style={[styles.inputContainer, error && styles.errorContainer]}>
        <View style={styles.countryCodeBox}>
          <Text style={styles.countryCodeText}>+91</Text>
        </View>
        <TextInput
          placeholder={t("enterMobileNumber")}
          placeholderTextColor={theme.colors.textGrey}
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

function getStyles(theme: any, variant: "default" | "line" = "default") { 
  const isLine = variant === 'line';
  return StyleSheet.create({
  container: {
    marginBottom: 4,
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: isLine ? '#666666' : theme.colors.primary,
    marginBottom: 6,
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: isLine ? 'transparent' : theme.colors.surfaceElevated,
    borderRadius: isLine ? 0 : 12,
    overflow: "hidden",
    borderWidth: isLine ? 0 : 1,
    borderBottomWidth: isLine ? 1.5 : 1,
    borderColor: isLine ? '#cbd5e1' : theme.colors.border,
    borderBottomColor: isLine ? '#F8CF2C' : theme.colors.border,
    height: 50,
    shadowColor: isLine ? 'transparent' : theme.colors.shadow,
    shadowOffset: isLine ? { width: 0, height: 0 } : {
      width: 0,
      height: 2,
    },
    shadowOpacity: isLine ? 0 : 0.1,
    shadowRadius: isLine ? 0 : 3,
    elevation: isLine ? 0 : 3,
  },
  errorContainer: {
    backgroundColor: isLine ? 'transparent' : theme.colors.surfaceElevated,
    borderColor: theme.colors.error,
    borderWidth: isLine ? 0 : 2,
    borderBottomWidth: isLine ? 2 : 2,
  },
  countryCodeBox: {
    backgroundColor: isLine ? 'transparent' : theme.colors.goldLight,
    paddingHorizontal: isLine ? 4 : 16,
    paddingVertical: 0,
    borderRightWidth: isLine ? 0 : 1,
    borderRightColor: theme.colors.border,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    minWidth: isLine ? 35 : 50,
  },
  countryCodeText: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingHorizontal: isLine ? 8 : 12,
    paddingVertical: 0,
    fontSize: 16,
    height: 50,
    backgroundColor: isLine ? 'transparent' : theme.colors.surfaceElevated,
    color: theme.colors.textDark,
    fontWeight: "500",
    textAlignVertical: "center",
    includeFontPadding: false,
    paddingTop: 0,
    paddingBottom: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  inputError: {
    backgroundColor: isLine ? 'transparent' : theme.colors.surfaceElevated,
    color: theme.colors.textDark,
  },
  counterText: {
    textAlign: "right",
    paddingRight: 4,
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  errorText: {
    color: theme.colors.error,
    backgroundColor: theme.colors.errorLight,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    fontWeight: "500",
  },
}) }

var styles: any;

export default PhoneInput;

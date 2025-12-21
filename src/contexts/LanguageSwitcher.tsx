// components/LanguageSwitcher.tsx
import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageName, getLanguageFlag } from "@/utils/languageUtils";
import { theme } from "@/constants/theme";
import LanguageSelector from "@/components/LanguageSelector";

const LanguageSwitcher = () => {
  const { locale, setLocale } = useTranslation();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleLanguageChange = async () => {
    setShowLanguageSelector(true);
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handleLanguageChange}>
        <View style={styles.languageInfo}>
          <Text style={styles.flag}>{getLanguageFlag(locale)}</Text>
          <Text style={styles.languageName}>{getLanguageName(locale)}</Text>
        </View>
        <Text style={styles.changeText}>Change</Text>
      </TouchableOpacity>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.textPrimary,
  },
  changeText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "500",
  },
});

export default LanguageSwitcher;

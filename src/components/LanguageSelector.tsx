import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { useTranslation } from "@/hooks/useTranslation";
import { getLanguageName, getLanguageFlag } from "@/utils/languageUtils";
import { theme } from "@/constants/theme";

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { locale, setLocale, supportedLocales, t } = useTranslation();

  const handleLanguageSelect = async (selectedLocale: string) => {
    await setLocale(selectedLocale as any);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Language</Text>
          <Text style={styles.subtitle}>
            {t("selectLanguageSubtitle")}
          </Text>

          {supportedLocales.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageOption,
                locale === lang && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(lang)}
            >
              <Text style={styles.flag}>{getLanguageFlag(lang)}</Text>
              <Text
                style={[
                  styles.languageName,
                  locale === lang && styles.selectedLanguageText,
                ]}
              >
                {getLanguageName(lang)}
              </Text>
              {locale === lang && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlayDark,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    width: "100%",
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedLanguage: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bgPrimaryLight,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.primary,
  },
  selectedLanguageText: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
  },
});

export default LanguageSelector;

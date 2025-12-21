import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';
import { theme } from '@/constants/theme';

interface DrawerContentLayoutProps {
  children: React.ReactNode;
  title?: string;
  showLanguageSwitcher?: boolean;
}

const DrawerContentLayout: React.FC<DrawerContentLayoutProps> = ({
  children,
  title,
  showLanguageSwitcher = true,
}) => {
  const version = Constants.expoConfig?.version || '1.0.0';

  return (
    <AppLayoutWrapper
      showHeader={true}
      showBottomBar={false}
      headerProps={{
        showBackButton: true,
        showMenu: false,
        showLanguageSwitcher: showLanguageSwitcher,
        title: title,
      }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
            {children}
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>v{version}</Text>
          <Text style={styles.copyrightText}>
             DC Jewellers. All rights reserved.
          </Text>
        </View>
      </View>
    </AppLayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Ensure background matches theme
  },
  content: {
    flex: 1,
    padding: 16, // Add some default padding for content
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight, // Subtle separator
    backgroundColor: theme.colors.backgroundSecondary, // Slightly different background for footer
    marginTop: 'auto', // Push to bottom if content is short
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: theme.colors.textLightGrey,
  },
});

export default DrawerContentLayout;
 
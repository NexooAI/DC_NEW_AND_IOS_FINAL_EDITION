import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SchemeDetailV2, parseSchemeV2, ParsedSchemeV2 } from '@/components/schemesV2';
import useGlobalStore from '@/store/global.store';
import { logger } from '@/utils/logger';

export default function SchemeDetailV2Route() {
  const router = useRouter();
  const params = useLocalSearchParams<{ schemeId?: string }>();
  const { language, setTabVisibility } = useGlobalStore();
  const [parsedScheme, setParsedScheme] = useState<ParsedSchemeV2 | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setTabVisibility(false);
      return () => {
        setTabVisibility(true);
      };
    }, [setTabVisibility])
  );

  useEffect(() => {
    const loadScheme = async () => {
      try {
        const stored = await AsyncStorage.getItem('@current_scheme_data');
        if (stored) {
          const raw = JSON.parse(stored);
          const parsed = parseSchemeV2(raw.rawScheme || raw, language);
          setParsedScheme(parsed);
        } else {
          logger.warn('No @current_scheme_data found in storage');
        }
      } catch (err) {
        logger.error('Error loading scheme detail v2:', err);
      } finally {
        setLoading(false);
      }
    };

    loadScheme();
  }, [params.schemeId, language]);

  const handleJoinScheme = async (scheme: ParsedSchemeV2) => {
    try {
      const schemeId = scheme.id;
      const targetFrequency = scheme.type === 'Flexi' ? 'Flexi' : 'Monthly';
      const schemeDataToStore = {
        schemeId: schemeId,
        id: schemeId,
        SCHEMEID: schemeId,
        name: scheme.name,
        description: scheme.description || scheme.aboutParagraph,
        type: targetFrequency,
        chits: scheme.rawScheme?.chits || [],
        schemeType: scheme.type.toLowerCase() === 'flexi' ? 'flexi' : 'fixed',
        activeTab: targetFrequency,
        benefits: scheme.rawScheme?.BENEFITS || [],
        slogan: scheme.slogan,
        image: scheme.rawScheme?.IMAGE || '',
        icon: scheme.rawScheme?.ICON || '',
        durationMonths: scheme.tenureMonths,
        metaData: scheme.rawScheme?.table_meta || scheme.rawScheme?.meta_data || null,
        instant_intrest: scheme.rawScheme?.instant_intrest || false,
        timestamp: new Date().toISOString(),
        savingType: scheme.savingType,
        rawScheme: scheme.rawScheme,
      };

      await AsyncStorage.setItem(
        '@current_scheme_data',
        JSON.stringify(schemeDataToStore)
      );

      router.push({
        pathname: '/home/join_savings',
        params: {
          schemeId: String(schemeId),
        },
      });
    } catch (err) {
      logger.error('Error preparing join savings from V2:', err);
      Alert.alert('Error', 'Unable to start joining scheme at this moment.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#850111" />
      </View>
    );
  }

  if (!parsedScheme) {
    return null;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SchemeDetailV2
        scheme={parsedScheme}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/(app)/(tabs)/home/schemes");
          }
        }}
        onJoinScheme={handleJoinScheme}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
  },
});

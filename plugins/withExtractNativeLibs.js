const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

function withExtractNativeLibs(config) {
  // 1. Modify AndroidManifest.xml
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'true';
    return config;
  });

  // 2. Modify gradle.properties to ensure AGP extracts the native libraries
  config = withGradleProperties(config, (config) => {
    const item = config.modResults.find((i) => i.key === 'expo.useLegacyPackaging');
    if (item) {
      item.value = 'true';
      console.log('[withExtractNativeLibs] Updated expo.useLegacyPackaging to true in gradle.properties');
    } else {
      config.modResults.push({
        type: 'property',
        key: 'expo.useLegacyPackaging',
        value: 'true',
      });
      console.log('[withExtractNativeLibs] Added expo.useLegacyPackaging=true to gradle.properties');
    }
    return config;
  });

  return config;
}

module.exports = withExtractNativeLibs;

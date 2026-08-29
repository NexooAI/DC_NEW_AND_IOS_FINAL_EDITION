const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withExtractNativeLibs(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application[0];
    mainApplication.$['android:extractNativeLibs'] = 'true';
    return config;
  });
};

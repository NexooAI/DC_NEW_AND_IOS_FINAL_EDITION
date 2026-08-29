const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withCrashlyticsSymbols(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      if (!contents.includes('nativeSymbolUploadEnabled true')) {
        contents += `
android {
    buildTypes {
        release {
            firebaseCrashlytics {
                nativeSymbolUploadEnabled true
            }
        }
    }
}
`;
        config.modResults.contents = contents;
        console.log('[withCrashlyticsSymbols] Appended nativeSymbolUploadEnabled config to build.gradle');
      } else {
        console.log('[withCrashlyticsSymbols] nativeSymbolUploadEnabled config already exists in build.gradle');
      }
    } else {
      console.warn('[withCrashlyticsSymbols] Warning: build.gradle language is not Groovy. Skipping.');
    }
    return config;
  });
};

const { withAndroidManifest, withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidNativeFixes = (config) => {
  // 1. Modify AndroidManifest.xml to set android:extractNativeLibs="true"
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];
    if (mainApplication) {
      mainApplication['$']['android:extractNativeLibs'] = 'true';
      console.log('[withAndroidNativeFixes] Set android:extractNativeLibs="true" in AndroidManifest.xml');
    }
    return config;
  });

  // 2. Modify android/app/build.gradle to add packagingOptions and ndk.abiFilters
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // Update packagingOptions
      if (contents.includes('packagingOptions {') && !contents.includes('libc++_shared.so')) {
        contents = contents.replace(
          /packagingOptions\s*\{/,
          `packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
        pickFirst 'lib/armeabi-v7a/libc++_shared.so'
        pickFirst 'lib/arm64-v8a/libc++_shared.so'`
        );
        console.log('[withAndroidNativeFixes] Added pickFirst rules to packagingOptions in build.gradle');
      }

      // Add ndk.abiFilters inside defaultConfig
      if (contents.includes('defaultConfig {') && !contents.includes('abiFilters')) {
        contents = contents.replace(
          /defaultConfig\s*\{/,
          `defaultConfig {
        ndk {
            abiFilters 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'
        }`
        );
        console.log('[withAndroidNativeFixes] Added ndk.abiFilters to defaultConfig in build.gradle');
      }

      config.modResults.contents = contents;
    } else {
      console.warn('[withAndroidNativeFixes] Warning: build.gradle language is not groovy. Skipping modification.');
    }
    return config;
  });

  return config;
};

module.exports = withAndroidNativeFixes;

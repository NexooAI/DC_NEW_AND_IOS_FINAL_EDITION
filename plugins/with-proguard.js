const { withGradleProperties, withDangerousMod, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CUSTOM_PROGUARD_RULES = `
# Ignore missing reflection/interface warnings globally for R8
-ignorewarnings

# react-native-webview
-keep class com.reactnativecommunity.webview.** { *; }
-keepclassmembers class com.reactnativecommunity.webview.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Socket.IO & OkHttp
-keep class io.socket.** { *; }
-keep class okhttp3.** { *; }
-keep class okio.** { *; }
-dontwarn io.socket.**
-dontwarn okhttp3.**
-dontwarn okio.**

# react-native-sms-retriever
-keep class me.furtado.smsretriever.** { *; }
-dontwarn com.google.android.gms.auth.api.credentials.**

# Expo Modules, Kotlin Reflection & Sharing / FileSystem R8 rules
-keep class expo.modules.** { *; }
-keepclassmembers class expo.modules.** { *; }
-keep interface expo.modules.** { *; }
-keepclassmembers interface expo.modules.** { *; }
-dontwarn expo.modules.**
-dontwarn expo.modules.interfaces.**
-dontwarn expo.modules.interfaces.filesystem.**
-dontwarn expo.modules.kotlin.**
-dontwarn expo.modules.sharing.**
`;

module.exports = function withProguard(config) {
  // 1. Disable R8 Full Mode & Disable Crashlytics Mapping File Upload (which causes Groovy XmlSlurper crash)
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "android.enableR8.fullMode",
      value: "false",
    });
    config.modResults.push({
      type: "property",
      key: "firebaseCrashlytics.mappingFileUploadEnabled",
      value: "false",
    });
    return config;
  });

  // 2. Configure app/build.gradle to disable mappingFileUploadEnabled for release build type
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let content = config.modResults.contents;
      if (!content.includes('mappingFileUploadEnabled false')) {
        content = content.replace(
          /buildTypes\s*\{[\s\S]*?release\s*\{/,
          (match) => `${match}\n            firebaseCrashlytics { mappingFileUploadEnabled false }`
        );
        config.modResults.contents = content;
      }
    }
    return config;
  });

  // 3. Append Proguard Keep Rules to android/app/proguard-rules.pro dynamically
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'proguard-rules.pro'
      );
      if (fs.existsSync(proguardPath)) {
        let content = fs.readFileSync(proguardPath, 'utf8');
        if (!content.includes('react-native-webview')) {
          content += '\n' + CUSTOM_PROGUARD_RULES;
          fs.writeFileSync(proguardPath, content, 'utf8');
        }
      }
      return config;
    },
  ]);

  return config;
};

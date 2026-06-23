const { withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const CUSTOM_PROGUARD_RULES = `
# react-native-webview
-keep class com.reactnativecommunity.webview.** { *; }
-keepclassmembers class com.reactnativecommunity.webview.** {
   *;
}
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
`;

module.exports = function withProguard(config) {
  // 1. Disable R8 Full Mode in gradle.properties
  config = withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "android.enableR8.fullMode",
      value: "false",
    });
    return config;
  });

  // 2. Append Proguard Keep Rules to android/app/proguard-rules.pro dynamically
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

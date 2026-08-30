const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to ensure necessary dependencies for SMS Retriever are present.
 * react-native-sms-retriever requires com.google.android.gms:play-services-auth
 */
const withSmsRetriever = (config) => {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addDependency(config.modResults.contents);
    } else {
      throw new Error('Cannot add SMS Retriever dependency to build.gradle because it is not groovy');
    }
    return config;
  });
};

function addDependency(buildGradle) {
  if (buildGradle.includes('com.google.android.gms:play-services-auth')) {
    return buildGradle;
  }

  // Add the dependency to the dependencies block
  return buildGradle.replace(
    /dependencies\s?{/,
    `dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    implementation 'com.google.android.gms:play-services-base:18.2.0'`
  );
}

module.exports = withSmsRetriever;

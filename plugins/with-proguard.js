const { withGradleProperties } = require('@expo/config-plugins');

module.exports = function withProguard(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "property",
      key: "android.enableR8.fullMode",
      value: "true",
    });
    return config;
  });
};

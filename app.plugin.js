const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function (config) {
  return withAndroidManifest(config, (config) => {
    // Add any necessary Android manifest modifications
    return config;
  });
};

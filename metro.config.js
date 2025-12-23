// Learn more https://docs.expo.io/guides/customizing-metro
// Learn more https://docs.expo.io/guides/customizing-metro
// Polyfill for Array.prototype.toReversed (required by Metro in newer Expo versions on Node < 20)
if (!Array.prototype.toReversed) {
  Array.prototype.toReversed = function () {
    return this.slice().reverse();
  };
}

const { getDefaultConfig } = require("@expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add any custom configurations
config.resolver.sourceExts.push("mjs");

// Disable web support - native-only app
config.resolver.platforms = ["ios", "android", "native"];

// Configure path aliases
config.resolver.alias = {
  "@": path.resolve(__dirname, "src"),
};

// Exclude web-specific modules
config.resolver.blockList = [
  /node_modules\/react-native-web\/.*/,
  /node_modules\/react-dom\/.*/,
];

module.exports = withNativeWind(config, { input: "./src/global.css" });

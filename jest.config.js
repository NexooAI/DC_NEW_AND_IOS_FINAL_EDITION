module.exports = {
    preset: "react-native",
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@rneui/.*|@gluestack-ui/.*|nativewind|expo-router|expo-.*|@expo/.*)",
    ],
    setupFiles: ["./jest-setup.js"],
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1",
        "^src/(.*)$": "<rootDir>/src/$1",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/jest-setup.js",
    },
    collectCoverage: false,
    collectCoverageFrom: [
        "**/*.{ts,tsx}",
        "!**/coverage/**",
        "!**/node_modules/**",
        "!**/babel.config.js",
        "!**/jest.setup.js",
    ],
    testMatch: ["<rootDir>/src/__tests__/**/*.test.tsx"],
    roots: ["<rootDir>"],
};
